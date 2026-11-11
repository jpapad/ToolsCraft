"use client";

import { canvasToBlob, openPdf, renderPage } from "@/lib/engines/pdf/pdfjs";
import type { Processor } from "@/lib/tools/types";
import { parseRanges } from "@/lib/engines/pdf/ranges";

export interface PdfToImagesOptions {
  format: "png" | "jpeg";
  dpi: number;
  /** Empty = all pages. */
  pages: string;
}

const PT_PER_INCH = 72;

export const pdfToImagesProcessor: Processor<PdfToImagesOptions> = {
  mode: "each",
  async run(file, opts, { signal, onProgress }) {
    const { doc, close } = await openPdf(await file.arrayBuffer());
    try {
      const count = doc.numPages;
      const pages = opts.pages.trim() ? [...new Set(parseRanges(opts.pages, count).flat())] : [...Array(count).keys()];
      const base = file.name.replace(/\.pdf$/i, "");
      const ext = opts.format === "png" ? "png" : "jpg";
      const pad = String(count).length;
      const outputs = [];

      for (const [i, index] of pages.entries()) {
        signal.throwIfAborted();
        const page = await doc.getPage(index + 1);
        const canvas = await renderPage(page, { scale: opts.dpi / PT_PER_INCH });
        const blob = await canvasToBlob(canvas, `image/${opts.format}`, 0.92);
        canvas.width = canvas.height = 0; // free the bitmap memory right away
        page.cleanup();
        outputs.push({ name: `${base}-page-${String(index + 1).padStart(pad, "0")}.${ext}`, blob });
        onProgress(Math.round(((i + 1) / pages.length) * 100));
      }
      return outputs;
    } finally {
      await close();
    }
  },
};
