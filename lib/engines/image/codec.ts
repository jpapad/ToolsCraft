/**
 * Image decode/encode helpers. Meant to run inside a Web Worker:
 * decoding uses the browser's own decoders (createImageBitmap), encoding uses
 * Squoosh's WASM codecs via jSquash for much better compression than canvas.
 */
import type { ImageFormat } from "./formats";
import { encodeAvif, optimisePng } from "./single-thread-codecs";

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ResizeSpec =
  | { mode: "percent"; percent: number }
  | { mode: "pixels"; width?: number; height?: number; keepAspect: boolean };

export interface DecodeOptions {
  /** Longest side in pixels; larger images are scaled down (never up). */
  maxDimension?: number;
  /** Exact resize (may upscale). Applied after cropping. */
  resize?: ResizeSpec;
  /** Area to keep, in pixels of the correctly-oriented image. */
  crop?: CropRect;
  /** Fill color behind transparent pixels (needed for JPG). */
  background?: string;
}

export function fitWithin(width: number, height: number, maxDimension?: number) {
  if (!maxDimension || Math.max(width, height) <= maxDimension) return { width, height };
  const scale = maxDimension / Math.max(width, height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

const MAX_SIDE = 16_384; // browsers refuse larger canvases

/** Output size for a resize request. With keepAspect and both sides given, fits inside the box. */
export function resizeTarget(width: number, height: number, spec: ResizeSpec) {
  let w: number;
  let h: number;
  if (spec.mode === "percent") {
    w = (width * spec.percent) / 100;
    h = (height * spec.percent) / 100;
  } else if (spec.width && spec.height) {
    if (spec.keepAspect) {
      const scale = Math.min(spec.width / width, spec.height / height);
      w = width * scale;
      h = height * scale;
    } else {
      w = spec.width;
      h = spec.height;
    }
  } else if (spec.width) {
    w = spec.width;
    h = (height * spec.width) / width;
  } else if (spec.height) {
    h = spec.height;
    w = (width * spec.height) / height;
  } else {
    w = width;
    h = height;
  }
  const clamp = (v: number) => Math.min(MAX_SIDE, Math.max(1, Math.round(v)));
  return { width: clamp(w), height: clamp(h) };
}

/**
 * Decodes any browser-supported image to pixels, optionally cropping and resizing.
 * EXIF rotation is applied and metadata (GPS, camera info) is dropped.
 * `resized` is true if the pixel dimensions changed.
 */
export async function decodeImage(
  blob: Blob,
  opts: DecodeOptions = {},
): Promise<{ image: ImageData; resized: boolean }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    throw new Error("This image format isn't supported by your browser, or the file is damaged.");
  }

  const src = opts.crop
    ? {
        x: Math.max(0, Math.round(opts.crop.x)),
        y: Math.max(0, Math.round(opts.crop.y)),
        width: Math.min(bitmap.width, Math.round(opts.crop.width)),
        height: Math.min(bitmap.height, Math.round(opts.crop.height)),
      }
    : { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  src.width = Math.max(1, Math.min(src.width, bitmap.width - src.x));
  src.height = Math.max(1, Math.min(src.height, bitmap.height - src.y));

  const { width, height } = opts.resize
    ? resizeTarget(src.width, src.height, opts.resize)
    : fitWithin(src.width, src.height, opts.maxDimension);
  const resized = width !== bitmap.width || height !== bitmap.height;

  if (resized || opts.crop) {
    const scaled = await createImageBitmap(bitmap, src.x, src.y, src.width, src.height, {
      resizeWidth: width,
      resizeHeight: height,
      resizeQuality: "high",
    });
    bitmap.close();
    bitmap = scaled;
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Your browser can't process images in the background.");
  if (opts.background) {
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { image: ctx.getImageData(0, 0, width, height), resized };
}

export function hasTransparency(img: ImageData): boolean {
  const d = img.data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 255) return true;
  return false;
}

/** Encodes pixels. `quality` is 0–100 and ignored for PNG (always lossless). */
export async function encodeImage(img: ImageData, format: ImageFormat, quality: number): Promise<ArrayBuffer> {
  switch (format) {
    case "jpeg": {
      const { default: encode } = await import("@jsquash/jpeg/encode");
      return encode(img, { quality });
    }
    case "webp": {
      const { default: encode } = await import("@jsquash/webp/encode");
      return encode(img, { quality });
    }
    case "avif": {
      // AVIF's quality scale runs lower than JPG's for the same look; speed 6 is a good balance.
      return encodeAvif(img, { quality: Math.round(quality * 0.85), speed: 6 });
    }
    case "png": {
      return optimisePng(img, 2);
    }
  }
}

