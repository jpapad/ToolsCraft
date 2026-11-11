import { PDFDocument } from "pdf-lib";
import { loadPdf } from "@/lib/engines/pdf/load";
import { parseRanges } from "@/lib/engines/pdf/ranges";

export { isValidRangeSyntax, parseRanges } from "@/lib/engines/pdf/ranges";

export type SplitMode = "all" | "ranges" | "extract";

export interface SplitOptions {
  mode: SplitMode;
  /** e.g. "1-3, 5, 8-" (used by "ranges" and "extract"). */
  ranges: string;
}

export interface SplitOutput {
  name: string;
  bytes: Uint8Array;
}

const label = (pages: number[]) =>
  pages.length === 1 ? `page-${pages[0] + 1}` : `pages-${pages[0] + 1}-${pages[pages.length - 1] + 1}`;

async function extract(src: PDFDocument, pages: number[]) {
  const out = await PDFDocument.create();
  for (const p of await out.copyPages(src, pages)) out.addPage(p);
  out.setProducer("ToolsCraft");
  return out.save({ useObjectStreams: true });
}

export async function splitPdf(
  data: ArrayBuffer | Uint8Array,
  fileName: string,
  opts: SplitOptions,
  onProgress?: (pct: number) => void,
): Promise<SplitOutput[]> {
  const src = await loadPdf(data, fileName);
  const count = src.getPageCount();
  const base = fileName.replace(/\.pdf$/i, "");

  let groups: number[][];
  if (opts.mode === "all") {
    groups = Array.from({ length: count }, (_, i) => [i]);
  } else {
    groups = parseRanges(opts.ranges, count);
    if (opts.mode === "extract") groups = [[...new Set(groups.flat())]];
  }

  const outputs: SplitOutput[] = [];
  for (const [i, pages] of groups.entries()) {
    const name = opts.mode === "extract" ? `${base}-extracted.pdf` : `${base}-${label(pages)}.pdf`;
    outputs.push({ name, bytes: await extract(src, pages) });
    onProgress?.(Math.round(((i + 1) / groups.length) * 100));
  }
  return outputs;
}
