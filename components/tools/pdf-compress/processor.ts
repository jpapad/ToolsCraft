import { proxy, transfer } from "comlink";
import { withWorker } from "@/lib/workers/with-worker";
import type { Processor } from "@/lib/tools/types";
import type { CompressLevel, CompressResult } from "./compress";
import type { PdfCompressWorker } from "./worker";

export const pdfCompressProcessor: Processor<{ level: CompressLevel }> = {
  mode: "each",
  async run(file, { level }, { signal, onProgress }) {
    const data = await file.arrayBuffer();
    const result = await withWorker<PdfCompressWorker, CompressResult>(
      () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
      signal,
      (api) => api.compress(transfer(data, [data]), file.name, level, proxy(onProgress)),
    );
    if (result.unchanged) {
      throw new Error(
        result.images === 0
          ? "This PDF has no images to compress. It’s probably already as small as it can be."
          : "This PDF is already well optimized. Try a stronger level.",
      );
    }
    const name = file.name.replace(/\.pdf$/i, "") + "-compressed.pdf";
    return [{ name, blob: new Blob([result.bytes as BlobPart], { type: "application/pdf" }) }];
  },
};
