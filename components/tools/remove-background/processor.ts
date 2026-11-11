"use client";

import { proxy, releaseProxy, wrap, type Remote } from "comlink";
import { renameExt } from "@/lib/utils/files";
import type { Processor } from "@/lib/tools/types";
import { modelChain, rememberFailure, type ModelKey } from "./models";
import type { BackgroundWorker } from "./worker";

export interface BackgroundOptions {
  /** null = transparent */
  background: string | null;
}

/**
 * Unlike other tools, this keeps one worker alive between images, since loading
 * the AI model takes seconds. When a model fails, its worker is thrown away so the
 * next model starts with fresh WASM memory.
 */
let current: { worker: Worker; api: Remote<BackgroundWorker> } | null = null;
/** Models still worth trying this session, best first. */
let chain: ModelKey[] | null = null;

function getWorker() {
  if (!current) {
    const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    current = { worker, api: wrap<BackgroundWorker>(worker) };
  }
  return current;
}

function killWorker() {
  if (!current) return;
  current.api[releaseProxy]();
  current.worker.terminate();
  current = null;
}

/** Fetch failures in Chrome ("Failed to fetch"), Firefox ("NetworkError") and Safari ("Load failed"). */
const isNetworkError = (msg: string) => /Failed to fetch|NetworkError|Load failed|Could not locate file/i.test(msg);

export const backgroundProcessor: Processor<BackgroundOptions> = {
  mode: "each",
  async run(file, { background }, { signal, onProgress }) {
    signal.throwIfAborted();
    chain ??= await modelChain();

    // Model download is the first 60% of the bar, the actual cut-out the rest.
    const report = proxy((stage: "download" | "process", pct: number) =>
      onProgress(stage === "download" ? pct * 0.6 : 60 + pct * 0.4),
    );

    let onAbort = () => {};
    const aborted = new Promise<never>((_, reject) => {
      onAbort = () => {
        killWorker(); // the only way to stop a running model
        reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      };
    });
    signal.addEventListener("abort", onAbort, { once: true });

    try {
      while (chain.length) {
        const key = chain[0];
        try {
          const result = await Promise.race([getWorker().api.remove(file, key, background, report), aborted]);
          const name = renameExt(file.name, "png").replace(/\.png$/, "-no-bg.png");
          return [{ name, blob: new Blob([result.data], { type: "image/png" }) }];
        } catch (e) {
          if (signal.aborted) throw e;
          killWorker();
          const msg = e instanceof Error ? e.message : String(e);
          if (isNetworkError(msg)) {
            throw new Error("Couldn’t download the AI model. Check your internet connection and try again.");
          }
          // This model can't run here (out of memory, unsupported GPU op…): try the next one.
          console.warn(`Background removal with ${key} failed, trying a lighter model.`, e);
          rememberFailure(key);
          chain = chain.slice(1);
          onProgress(0);
        }
      }
      chain = null; // let the next attempt start over
      throw new Error("Your browser couldn’t run the AI model. Try the latest Chrome or Edge.");
    } finally {
      signal.removeEventListener("abort", onAbort);
    }
  },
};
