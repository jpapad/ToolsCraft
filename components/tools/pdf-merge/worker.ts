import { expose, transfer } from "comlink";
import { mergePdfs, type PdfInput } from "./merge";

const api = {
  async merge(inputs: PdfInput[], onProgress: (pct: number) => void) {
    const bytes = await mergePdfs(inputs, onProgress);
    return transfer(bytes, [bytes.buffer as ArrayBuffer]);
  },
};

export type PdfMergeWorker = typeof api;
expose(api);
