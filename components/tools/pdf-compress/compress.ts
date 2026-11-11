import { unzlibSync } from "fflate";
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFRawStream, PDFRef, type PDFObject } from "pdf-lib";
import { loadPdf } from "@/lib/engines/pdf/load";

export type CompressLevel = "light" | "recommended" | "strong";

export const LEVELS: Record<CompressLevel, { quality: number; maxDimension: number }> = {
  light: { quality: 82, maxDimension: 3000 },
  recommended: { quality: 70, maxDimension: 2000 },
  strong: { quality: 50, maxDimension: 1400 },
};

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Image operations the compressor needs. In the browser: createImageBitmap + MozJPEG. */
export interface ImageCodec {
  /** Decodes JPEG bytes to RGBA, scaling down so the longest side ≤ maxDimension. */
  decodeJpeg(bytes: Uint8Array, maxDimension: number): Promise<Pixels>;
  /** Scales RGBA pixels down so the longest side ≤ maxDimension (no-op if already smaller). */
  downscale(px: Pixels, maxDimension: number): Promise<Pixels>;
  encodeJpeg(px: Pixels, quality: number, grayscale: boolean): Promise<Uint8Array>;
}

export interface CompressResult {
  bytes: Uint8Array;
  images: number;
  recompressed: number;
  /** True when nothing could be saved and the original file was returned. */
  unchanged: boolean;
}

const N = (s: string) => PDFName.of(s);
/** Images smaller than this aren't worth re-encoding. */
const MIN_IMAGE_BYTES = 16 * 1024;

/** Reverses PNG row filters (PDF /Predictor 10–15) for 8-bit samples. */
export function unpredictPng(data: Uint8Array, columns: number, colors: number): Uint8Array {
  const rowLen = columns * colors;
  const rows = Math.floor(data.length / (rowLen + 1));
  const out = new Uint8Array(rows * rowLen);
  for (let r = 0; r < rows; r++) {
    const filter = data[r * (rowLen + 1)];
    const src = r * (rowLen + 1) + 1;
    const dst = r * rowLen;
    for (let i = 0; i < rowLen; i++) {
      const raw = data[src + i];
      const left = i >= colors ? out[dst + i - colors] : 0;
      const up = r > 0 ? out[dst - rowLen + i] : 0;
      const upLeft = r > 0 && i >= colors ? out[dst - rowLen + i - colors] : 0;
      let v: number;
      switch (filter) {
        case 0: v = raw; break;
        case 1: v = raw + left; break;
        case 2: v = raw + up; break;
        case 3: v = raw + ((left + up) >> 1); break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          v = raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft);
          break;
        }
        default: throw new Error(`Unknown PNG filter ${filter}`);
      }
      out[dst + i] = v & 0xff;
    }
  }
  return out;
}

/** Expands 1, 3 or 4 (CMYK) channel samples to RGBA. */
export function toRgba(samples: Uint8Array, width: number, height: number, comps: number): Pixels {
  const n = width * height;
  const data = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    let r: number, g: number, b: number;
    if (comps === 1) {
      r = g = b = samples[i];
    } else if (comps === 3) {
      r = samples[i * 3]; g = samples[i * 3 + 1]; b = samples[i * 3 + 2];
    } else {
      const k = 1 - samples[i * 4 + 3] / 255;
      r = (255 - samples[i * 4]) * k; g = (255 - samples[i * 4 + 1]) * k; b = (255 - samples[i * 4 + 2]) * k;
    }
    data[i * 4] = r; data[i * 4 + 1] = g; data[i * 4 + 2] = b; data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}

function asNames(obj: PDFObject | undefined): string[] {
  if (obj instanceof PDFName) return [obj.decodeText()];
  if (obj instanceof PDFArray) return obj.asArray().map((o) => (o instanceof PDFName ? o.decodeText() : "?"));
  return [];
}

export async function compressPdf(
  data: ArrayBuffer | Uint8Array,
  name: string,
  level: CompressLevel,
  codec: ImageCodec,
  onProgress?: (pct: number) => void,
): Promise<CompressResult> {
  const original = data instanceof Uint8Array ? data : new Uint8Array(data);
  const doc = await loadPdf(original, name);
  const ctx = doc.context;
  const { quality, maxDimension } = LEVELS[level];
  const lookup = (o: PDFObject | undefined) => (o instanceof PDFRef ? ctx.lookup(o) : o);

  const images = ctx
    .enumerateIndirectObjects()
    .filter((e): e is [PDFRef, PDFRawStream] => e[1] instanceof PDFRawStream && lookup(e[1].dict.get(N("Subtype")))?.toString() === "/Image");

  // Soft masks (transparency) must stay lossless, so never touch them.
  const masks = new Set<string>();
  for (const [, s] of images) {
    for (const key of ["SMask", "Mask"]) {
      const m = s.dict.get(N(key));
      if (m instanceof PDFRef) masks.add(m.toString());
    }
  }

  let recompressed = 0;
  for (const [i, [ref, stream]] of images.entries()) {
    onProgress?.(Math.round((i / Math.max(1, images.length)) * 90));
    if (masks.has(ref.toString())) continue;
    try {
      const replacement = await recompress(stream);
      if (replacement) {
        ctx.assign(ref, replacement);
        recompressed++;
      }
    } catch {
      // Leave any image we can't safely handle exactly as it was.
    }
  }

  async function recompress(stream: PDFRawStream): Promise<PDFRawStream | null> {
    const d = stream.dict;
    const get = (k: string) => lookup(d.get(N(k)));
    if (stream.contents.length < MIN_IMAGE_BYTES) return null;
    if (get("ImageMask")?.toString() === "true" || d.has(N("Mask")) || d.has(N("Decode"))) return null;
    if ((get("BitsPerComponent") as PDFNumber | undefined)?.asNumber() !== 8) return null;

    const width = (get("Width") as PDFNumber).asNumber();
    const height = (get("Height") as PDFNumber).asNumber();

    // Work out the number of color channels; skip palettes, spot colors, etc.
    const cs = get("ColorSpace");
    let comps = 0;
    let keepColorSpace = false;
    if (cs instanceof PDFName) {
      comps = { "/DeviceGray": 1, "/DeviceRGB": 3, "/DeviceCMYK": 4 }[cs.toString()] ?? 0;
      keepColorSpace = comps !== 4;
    } else if (cs instanceof PDFArray && cs.get(0)?.toString() === "/ICCBased") {
      const icc = lookup(cs.get(1));
      const n = icc instanceof PDFRawStream ? (lookup(icc.dict.get(N("N"))) as PDFNumber | undefined)?.asNumber() : 0;
      comps = n === 1 || n === 3 || n === 4 ? n : 0;
      keepColorSpace = comps !== 4;
    }
    if (!comps) return null;

    const filters = asNames(get("Filter"));
    let px: Pixels;
    if (filters.length === 1 && filters[0] === "DCTDecode") {
      px = await codec.decodeJpeg(stream.contents, maxDimension);
    } else if (filters.length === 1 && filters[0] === "FlateDecode") {
      let samples: Uint8Array = unzlibSync(stream.contents);
      const parms = get("DecodeParms");
      const predictor = parms instanceof PDFDict ? (lookup(parms.get(N("Predictor"))) as PDFNumber | undefined)?.asNumber() ?? 1 : 1;
      if (predictor >= 10) samples = unpredictPng(samples, width, comps);
      else if (predictor !== 1) return null;
      if (samples.length < width * height * comps) return null;
      px = await codec.downscale(toRgba(samples, width, height, comps), maxDimension);
    } else {
      return null;
    }

    const grayscale = comps === 1;
    const jpeg = await codec.encodeJpeg(px, quality, grayscale);
    if (jpeg.length >= stream.contents.length * 0.9) return null; // not worth it

    const dict = d.clone(ctx);
    for (const k of ["Filter", "DecodeParms", "Length", "Decode"]) dict.delete(N(k));
    dict.set(N("Filter"), N("DCTDecode"));
    dict.set(N("Width"), PDFNumber.of(px.width));
    dict.set(N("Height"), PDFNumber.of(px.height));
    dict.set(N("BitsPerComponent"), PDFNumber.of(8));
    if (!keepColorSpace) dict.set(N("ColorSpace"), N(grayscale ? "DeviceGray" : "DeviceRGB"));
    return PDFRawStream.of(dict, jpeg);
  }

  doc.setProducer("ToolsCraft");
  const bytes = await doc.save({ useObjectStreams: true });
  onProgress?.(100);

  if (bytes.length >= original.length) {
    return { bytes: original, images: images.length, recompressed: 0, unchanged: true };
  }
  return { bytes, images: images.length, recompressed, unchanged: false };
}
