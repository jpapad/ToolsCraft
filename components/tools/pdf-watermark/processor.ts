"use client";

import { proxy, transfer } from "comlink";
import { withWorker } from "@/lib/workers/with-worker";
import type { Processor } from "@/lib/tools/types";
import type { MarkLayout } from "./placement";
import type { PdfWatermarkWorker } from "./worker";

export interface WatermarkOptions extends Omit<MarkLayout, "aspect"> {
  kind: "text" | "image";
  text: string;
  color: string;
  image: File | null;
  opacity: number;
}

async function canvasPng(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
  if (!blob) throw new Error("Could not prepare the watermark.");
  return new Uint8Array(await blob.arrayBuffer());
}

/** Renders text to a high-resolution transparent PNG (any language, any emoji). */
export async function textToPng(text: string, color: string): Promise<Uint8Array> {
  const size = 160;
  const font = `700 ${size}px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`;
  const canvas = document.createElement("canvas");
  let ctx = canvas.getContext("2d")!;
  ctx.font = font;
  const m = ctx.measureText(text);
  const pad = size * 0.15;
  canvas.width = Math.ceil(m.width + pad * 2);
  canvas.height = Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent + pad * 2);
  ctx = canvas.getContext("2d")!; // resizing resets the context state
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, pad, pad + m.actualBoundingBoxAscent);
  return canvasPng(canvas);
}

/** Converts any browser-readable image to PNG, capped at 2000px for sane file sizes. */
async function imageToPng(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("The watermark image couldn’t be read.");
  });
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasPng(canvas);
}

export const pdfWatermarkProcessor: Processor<WatermarkOptions> = {
  mode: "each",
  async run(file, opts, { signal, onProgress }) {
    if (opts.kind === "text" && !opts.text.trim()) throw new Error("Enter the watermark text.");
    if (opts.kind === "image" && !opts.image) throw new Error("Choose a watermark image.");
    const png = opts.kind === "text" ? await textToPng(opts.text.trim(), opts.color) : await imageToPng(opts.image!);
    const data = await file.arrayBuffer();

    const bytes = await withWorker<PdfWatermarkWorker, Uint8Array>(
      () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      signal,
      (api) =>
        api.apply(
          transfer(data, [data]),
          file.name,
          { png, opacity: opts.opacity, widthRatio: opts.widthRatio, angle: opts.angle, layout: opts.layout },
          proxy(onProgress),
        ),
    );
    return [
      { name: file.name.replace(/\.pdf$/i, "") + "-watermarked.pdf", blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) },
    ];
  },
};
