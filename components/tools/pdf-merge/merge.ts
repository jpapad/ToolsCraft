import { PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/engines/pdf/load";

export interface PdfInput {
  name: string;
  data: ArrayBuffer | Uint8Array;
}

/** Merges PDFs in the given order. Pure: runs in a worker, in Node tests, anywhere. */
export async function mergePdfs(inputs: PdfInput[], onProgress?: (pct: number) => void): Promise<Uint8Array> {
  if (inputs.length < 2) throw new Error("Add at least two PDF files to merge.");

  const out = await PDFDocument.create();

  for (const [i, input] of inputs.entries()) {
    const src = await loadPdf(input.data, input.name);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
    onProgress?.(Math.round(((i + 1) / inputs.length) * 90));
  }

  out.setProducer("ToolsCraft");
  out.setCreator("ToolsCraft");
  const bytes = await out.save({ useObjectStreams: true });
  onProgress?.(100);
  return bytes;
}
