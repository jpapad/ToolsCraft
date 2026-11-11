import { proxy, transfer } from "comlink";
import { withWorker } from "@/lib/workers/with-worker";
import type { Processor } from "@/lib/tools/types";
import type { PdfMergeWorker } from "./worker";

export interface PdfMergeOptions {
  fileName: string;
}

export const pdfMergeProcessor: Processor<PdfMergeOptions> = {
  mode: "combine",
  async run(files, opts, { signal, onProgress }) {
    const inputs = await Promise.all(files.map(async (f) => ({ name: f.name, data: await f.arrayBuffer() })));

    const bytes = await withWorker<PdfMergeWorker, Uint8Array>(
      () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      signal,
      (api) =>
        api.merge(
          // Hand the buffers to the worker without copying them.
          transfer(inputs, inputs.map((i) => i.data)),
          proxy(onProgress),
        ),
    );

    return [{ name: opts.fileName, blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) }];
  },
};
