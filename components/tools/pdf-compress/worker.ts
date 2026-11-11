import { expose, transfer } from "comlink";
import { fitWithin } from "@/lib/engines/image/codec";
import { compressPdf, type CompressLevel, type ImageCodec, type Pixels } from "./compress";

/**
 * PDF viewers ignore EXIF orientation inside embedded JPEGs, but browsers apply it
 * when decoding. Dropping the EXIF (APP1) segments keeps pixels as the PDF shows them.
 */
function stripExif(jpeg: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [jpeg.subarray(0, 2)];
  let pos = 2;
  while (pos + 4 <= jpeg.length && jpeg[pos] === 0xff) {
    const marker = jpeg[pos + 1];
    if (marker === 0xda) break; // start of scan: the rest is image data
    const len = (jpeg[pos + 2] << 8) | jpeg[pos + 3];
    if (marker !== 0xe1) parts.push(jpeg.subarray(pos, pos + 2 + len));
    pos += 2 + len;
  }
  parts.push(jpeg.subarray(pos));
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

async function bitmapToPixels(bitmap: ImageBitmap, maxDimension: number): Promise<Pixels> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDimension);
  let source = bitmap;
  if (width !== bitmap.width) {
    source = await createImageBitmap(bitmap, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" });
    bitmap.close();
  }
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(source, 0, 0);
  source.close();
  const img = ctx.getImageData(0, 0, width, height);
  return { data: img.data, width, height };
}

const codec: ImageCodec = {
  async decodeJpeg(bytes, maxDimension) {
    const blob = new Blob([stripExif(bytes) as BlobPart], { type: "image/jpeg" });
    // Keep the PDF's own color values; don't let the browser convert embedded profiles.
    return bitmapToPixels(await createImageBitmap(blob, { colorSpaceConversion: "none" }), maxDimension);
  },
  async downscale(px, maxDimension) {
    if (Math.max(px.width, px.height) <= maxDimension) return px;
    const img = new ImageData(px.data as Uint8ClampedArray<ArrayBuffer>, px.width, px.height);
    return bitmapToPixels(await createImageBitmap(img), maxDimension);
  },
  async encodeJpeg(px, quality, grayscale) {
    const { default: encode } = await import("@jsquash/jpeg/encode");
    const img = new ImageData(px.data as Uint8ClampedArray<ArrayBuffer>, px.width, px.height);
    return new Uint8Array(await encode(img, { quality, color_space: grayscale ? 1 : 3 }));
  },
};

const api = {
  async compress(data: ArrayBuffer, name: string, level: CompressLevel, onProgress: (pct: number) => void) {
    const result = await compressPdf(data, name, level, codec, onProgress);
    // `bytes` may be a view on the original input; copy so it can be transferred safely.
    const bytes = result.bytes.slice();
    return transfer({ ...result, bytes }, [bytes.buffer]);
  },
};

export type PdfCompressWorker = typeof api;
expose(api);
