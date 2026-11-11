export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export const imageFormats: Record<ImageFormat, { label: string; mime: string; ext: string; lossy: boolean }> = {
  jpeg: { label: "JPG", mime: "image/jpeg", ext: "jpg", lossy: true },
  png: { label: "PNG", mime: "image/png", ext: "png", lossy: false },
  webp: { label: "WebP", mime: "image/webp", ext: "webp", lossy: true },
  avif: { label: "AVIF", mime: "image/avif", ext: "avif", lossy: true },
};

export function formatFromMime(mime: string): ImageFormat | null {
  const entry = Object.entries(imageFormats).find(([, f]) => f.mime === mime);
  if (entry) return entry[0] as ImageFormat;
  return mime === "image/jpg" ? "jpeg" : null;
}

/** Image types the browser can decode for us. */
export const imageAccept = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/avif": [".avif"],
  "image/gif": [".gif"],
  "image/bmp": [".bmp"],
};
