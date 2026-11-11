import { transfer } from "comlink";
import { withWorker } from "@/lib/workers/with-worker";
import type { Processor } from "@/lib/tools/types";
import type { PdfProtectWorker, ProtectJob } from "./worker";

export type ProtectOptions = ProtectJob;

export const pdfProtectProcessor: Processor<ProtectOptions> = {
  mode: "each",
  async run(file, opts, { signal, onProgress }) {
    onProgress(20);
    const data = await file.arrayBuffer();
    const bytes = await withWorker<PdfProtectWorker, Uint8Array>(
      () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      signal,
      (api) => api.run(transfer(data, [data]), opts),
    );
    const suffix = opts.mode === "protect" ? "protected" : "unlocked";
    return [
      { name: `${file.name.replace(/\.pdf$/i, "")}-${suffix}.pdf`, blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) },
    ];
  },
};
