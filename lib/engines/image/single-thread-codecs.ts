/**
 * Single-threaded AVIF and OxiPNG encoders.
 *
 * jSquash's default entry points also import multi-threaded builds whose
 * workers import themselves, which deadlocks the Turbopack build. Those builds
 * need SharedArrayBuffer (cross-origin isolation) anyway, which we don't enable,
 * so we load the single-threaded builds directly.
 */
import type { AVIFModule } from "@jsquash/avif/codec/enc/avif_enc.js";
import { defaultOptions as avifDefaults } from "@jsquash/avif/meta.js";
import { initEmscriptenModule } from "@jsquash/avif/utils.js";

let avif: Promise<AVIFModule> | undefined;
let oxipng: Promise<typeof import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js")> | undefined;

export async function encodeAvif(img: ImageData, options: { quality: number; speed: number }): Promise<ArrayBuffer> {
  avif ??= import("@jsquash/avif/codec/enc/avif_enc.js").then((m) => initEmscriptenModule(m.default));
  const encoder = await avif;
  const output = encoder.encode(new Uint8Array(img.data.buffer), img.width, img.height, {
    ...avifDefaults,
    ...options,
  });
  if (!output) throw new Error("AVIF encoding failed.");
  return output.buffer as ArrayBuffer;
}

export async function optimisePng(img: ImageData, level = 2): Promise<ArrayBuffer> {
  oxipng ??= import("@jsquash/oxipng/codec/pkg/squoosh_oxipng.js").then(async (m) => {
    await m.default();
    return m;
  });
  const m = await oxipng;
  return m.optimise_raw(img.data, img.width, img.height, level, false, true).buffer as ArrayBuffer;
}
