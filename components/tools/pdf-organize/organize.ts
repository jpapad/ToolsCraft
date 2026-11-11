import { degrees, PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/engines/pdf/load";

export interface PageEdit {
  /** 0-based index in the original document. */
  index: number;
  /** Extra clockwise rotation in degrees (multiple of 90). */
  rotation: number;
}

/** Builds a new PDF with pages in the given order and rotation. Pages not listed are dropped. */
export async function organizePdf(data: ArrayBuffer | Uint8Array, name: string, edits: PageEdit[]): Promise<Uint8Array> {
  if (!edits.length) throw new Error("Keep at least one page.");
  const src = await loadPdf(data, name);
  const out = await PDFDocument.create();
  const copied = await out.copyPages(
    src,
    edits.map((e) => e.index),
  );
  copied.forEach((page, i) => {
    const total = (((page.getRotation().angle + edits[i].rotation) % 360) + 360) % 360;
    page.setRotation(degrees(total));
    out.addPage(page);
  });
  out.setProducer("ToolsCraft");
  return out.save({ useObjectStreams: true });
}
