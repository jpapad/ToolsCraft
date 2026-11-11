import { expose, transfer } from "comlink";
import { degrees, popGraphicsState, pushGraphicsState, type PDFDocument, type PDFPage } from "pdf-lib";
import { loadPdf } from "@/lib/engines/pdf/load";
import { placeWatermark, type MarkLayout } from "./placement";

export interface WatermarkJob extends Omit<MarkLayout, "aspect"> {
  /** PNG bytes of the watermark (text is pre-rendered on the page). */
  png: Uint8Array;
  opacity: number;
}

/**
 * Wraps the page's existing content in save/restore (q … Q). Some PDFs leave the
 * coordinate system transformed at the end of their content, which would
 * otherwise shift or scale anything drawn on top.
 */
function isolateExistingContent(doc: PDFDocument, page: PDFPage) {
  page.node.normalize();
  const start = doc.context.register(doc.context.contentStream([pushGraphicsState()]));
  const end = doc.context.register(doc.context.contentStream([popGraphicsState()]));
  page.node.wrapContentStreams(start, end);
}

const api = {
  async apply(data: ArrayBuffer, name: string, job: WatermarkJob, onProgress: (pct: number) => void) {
    const doc = await loadPdf(data, name);
    const image = await doc.embedPng(job.png);
    const aspect = image.height / image.width;
    const pages = doc.getPages();

    pages.forEach((page, i) => {
      isolateExistingContent(doc, page);
      const box = page.getCropBox();
      const placements = placeWatermark({ ...box, rotation: page.getRotation().angle }, { ...job, aspect });
      for (const p of placements) {
        page.drawImage(image, { x: p.x, y: p.y, width: p.width, height: p.height, rotate: degrees(p.rotate), opacity: job.opacity });
      }
      onProgress(Math.round(((i + 1) / pages.length) * 90));
    });

    doc.setProducer("ToolsCraft");
    const bytes = await doc.save({ useObjectStreams: true });
    onProgress(100);
    return transfer(bytes, [bytes.buffer as ArrayBuffer]);
  },
};

export type PdfWatermarkWorker = typeof api;
expose(api);
