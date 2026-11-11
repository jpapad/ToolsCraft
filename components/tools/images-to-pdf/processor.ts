import { proxy } from "comlink";
import { withWorker } from "@/lib/workers/with-worker";
import type { Processor } from "@/lib/tools/types";
import type { LayoutOptions } from "./layout";
import type { ImagesToPdfWorker } from "./worker";

export type ImagesToPdfOptions = LayoutOptions & { fileName: string };

export const imagesToPdfProcessor: Processor<ImagesToPdfOptions> = {
  mode: "combine",
  async run(files, { fileName, ...layout }, { signal, onProgress }) {
    const bytes = await withWorker<ImagesToPdfWorker, Uint8Array>(
      () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      signal,
      (api) => api.build(files.map((f) => ({ name: f.name, blob: f })), layout, proxy(onProgress)),
    );
    return [{ name: fileName, blob: new Blob([bytes as BlobPart], { type: "application/pdf" }) }];
  },
};
