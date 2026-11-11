import { releaseProxy, wrap, type Remote } from "comlink";

/**
 * Spawns a worker for one job, runs `fn` against its Comlink API, then terminates it.
 * Aborting the signal terminates the worker immediately (WASM/JS work can't be
 * interrupted any other way).
 *
 * `create` must contain the literal `new Worker(new URL("./worker.ts", import.meta.url))`
 * call so the bundler can find and bundle the worker file.
 */
export async function withWorker<T, R>(
  create: () => Worker,
  signal: AbortSignal,
  fn: (api: Remote<T>) => Promise<R>,
): Promise<R> {
  signal.throwIfAborted();
  const worker = create();
  const api = wrap<T>(worker);

  let onAbort = () => {};
  const aborted = new Promise<never>((_, reject) => {
    onAbort = () => reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
  });
  const crashed = new Promise<never>((_, reject) => {
    worker.addEventListener("error", (e) => reject(new Error(e.message || "The processing worker crashed.")));
  });
  signal.addEventListener("abort", onAbort, { once: true });

  try {
    return await Promise.race([fn(api), aborted, crashed]);
  } finally {
    signal.removeEventListener("abort", onAbort);
    api[releaseProxy]();
    worker.terminate();
  }
}
