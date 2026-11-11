import { proxy } from "comlink";
import { withWorker } from "@/lib/workers/with-worker";
import { renameExt } from "@/lib/utils/files";
import type { ProcessedFile, Processor } from "@/lib/tools/types";
import { imageFormats } from "./formats";
import type { ImageJob, ImageJobResult, ImageWorker } from "./worker";

/** Runs one image job in a fresh worker and returns the resulting file. */
export async function runImageJob(
  file: File,
  job: ImageJob,
  signal: AbortSignal,
  onProgress: (pct: number) => void = () => {},
): Promise<ProcessedFile & { width: number; height: number }> {
  const result = await withWorker<ImageWorker, ImageJobResult>(
    () => new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
    signal,
    // File objects are passed by reference to workers, not copied.
    (api) => api.process(file, job, proxy(onProgress)),
  );
  const info = imageFormats[result.format];
  const name = result.keptOriginal ? file.name : renameExt(file.name, info.ext);
  return { name, blob: new Blob([result.data], { type: info.mime }), width: result.width, height: result.height };
}

/** Builds an "each" processor that runs every image through the shared image worker. */
export function createImageProcessor<O>(toJob: (file: File, opts: O) => ImageJob): Processor<O> {
  return {
    mode: "each",
    async run(file, opts, { signal, onProgress }) {
      const { name, blob } = await runImageJob(file, toJob(file, opts), signal, onProgress);
      return [{ name, blob }];
    },
  };
}

/** A sensible default: use most cores, but leave one for the page itself. */
export const imageConcurrency = () =>
  typeof navigator === "undefined" ? 2 : Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1));
