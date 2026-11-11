import { expose, transfer } from "comlink";
import { env, pipeline, RawImage } from "@huggingface/transformers";
import { MODELS, type ModelKey } from "./models";

env.allowLocalModels = false; // always fetch from the model hub, cached by the browser afterwards

type Segmenter = (image: RawImage) => Promise<RawImage>;
/** One model per worker: if it fails, the page throws the whole worker away (and its WASM memory). */
let loaded: { key: ModelKey; segmenter: Promise<Segmenter> } | undefined;
let reportProgress: (stage: "download" | "process", pct: number) => void = () => {};

function load(key: ModelKey) {
  if (loaded?.key === key) return loaded.segmenter;
  const model = MODELS[key];
  const segmenter = pipeline("background-removal", model.id, {
    device: model.device,
    dtype: model.dtype,
    progress_callback: (info: { status: string; progress?: number }) => {
      if (info.status === "progress_total" && typeof info.progress === "number") reportProgress("download", info.progress);
    },
  }) as unknown as Promise<Segmenter>;
  loaded = { key, segmenter };
  return segmenter;
}

const api = {
  async remove(
    file: Blob,
    key: ModelKey,
    background: string | null,
    onProgress: (stage: "download" | "process", pct: number) => void,
  ) {
    reportProgress = onProgress;
    const segment = await load(key);
    onProgress("process", 5);
    const output = await segment(await RawImage.fromBlob(file)); // same size, background made transparent
    onProgress("process", 85);

    const canvas = new OffscreenCanvas(output.width, output.height);
    const ctx = canvas.getContext("2d")!;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(output.toCanvas() as OffscreenCanvas, 0, 0);
    const data = await (await canvas.convertToBlob({ type: "image/png" })).arrayBuffer();
    onProgress("process", 100);
    return transfer({ data, width: output.width, height: output.height }, [data]);
  },
};

export type BackgroundWorker = typeof api;
expose(api);
