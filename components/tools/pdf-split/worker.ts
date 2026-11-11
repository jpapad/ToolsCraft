import { expose, transfer } from "comlink";
import { splitPdf, type SplitOptions } from "./split";

const api = {
  async split(data: ArrayBuffer, name: string, opts: SplitOptions, onProgress: (pct: number) => void) {
    const outputs = await splitPdf(data, name, opts, onProgress);
    return transfer(
      outputs,
      outputs.map((o) => o.bytes.buffer as ArrayBuffer),
    );
  },
};

export type PdfSplitWorker = typeof api;
expose(api);
