import { proxy, transfer } from "comlink";
import { withWorker } from "@/lib/workers/with-worker";
import type { Processor } from "@/lib/tools/types";
import type { SplitOptions, SplitOutput } from "./split";
import type { PdfSplitWorker } from "./worker";

export const pdfSplitProcessor: Processor<SplitOptions> = {
  mode: "each",
  async run(file, opts, { signal, onProgress }) {
    const data = await file.arrayBuffer();
    const outputs = await withWorker<PdfSplitWorker, SplitOutput[]>(
      () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      signal,
      (api) => api.split(transfer(data, [data]), file.name, opts, proxy(onProgress)),
    );
    return outputs.map((o) => ({ name: o.name, blob: new Blob([o.bytes as BlobPart], { type: "application/pdf" }) }));
  },
};
