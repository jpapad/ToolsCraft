import { expose, transfer } from "comlink";
import { decodeImage, encodeImage, type CropRect, type ResizeSpec } from "./codec";
import { formatFromMime, type ImageFormat } from "./formats";

export interface ImageJob {
  /** Output format, or "keep" to reuse the input's format when possible. */
  format: ImageFormat | "keep";
  quality: number;
  maxDimension?: number;
  resize?: ResizeSpec;
  crop?: CropRect;
  /** Return the original file if re-encoding made it bigger (compressor). */
  keepIfLarger?: boolean;
}

export interface ImageJobResult {
  data: ArrayBuffer;
  format: ImageFormat;
  width: number;
  height: number;
  keptOriginal: boolean;
}

const api = {
  async process(file: Blob, job: ImageJob, onProgress: (pct: number) => void): Promise<ImageJobResult> {
    const source = formatFromMime(file.type);
    // GIF/BMP have no encoder here: fall back to WebP, which keeps transparency.
    const format: ImageFormat = job.format === "keep" ? (source ?? "webp") : job.format;

    onProgress(10);
    const { image, resized } = await decodeImage(file, {
      maxDimension: job.maxDimension,
      resize: job.resize,
      crop: job.crop,
      background: format === "jpeg" ? "#ffffff" : undefined,
    });
    onProgress(35);
    let data = await encodeImage(image, format, job.quality);
    onProgress(95);

    // Re-encoding an already-optimized file can make it bigger; then the original wins.
    const keptOriginal = !!job.keepIfLarger && !resized && format === source && data.byteLength >= file.size;
    if (keptOriginal) data = await file.arrayBuffer();

    return transfer({ data, format, width: image.width, height: image.height, keptOriginal }, [data]);
  },
};

export type ImageWorker = typeof api;
expose(api);
