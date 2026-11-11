"use client";

import { useCallback, useReducer, useRef } from "react";
import type { ProcessedFile, Processor } from "@/lib/tools/types";

export type Phase = "idle" | "ready" | "processing" | "done" | "error";
export type ItemStatus = "queued" | "processing" | "done" | "error";

export interface QueueItem {
  id: string;
  file: File;
  status: ItemStatus;
  progress: number;
  outputs: ProcessedFile[];
  error?: string;
}

export interface ProcessorState {
  phase: Phase;
  items: QueueItem[];
  outputs: ProcessedFile[];
  error?: string;
}

type Action =
  | { type: "ADD"; files: File[] }
  | { type: "REMOVE"; id: string }
  | { type: "REORDER"; ids: string[] }
  | { type: "START" }
  | { type: "PROGRESS"; ids: string[]; progress: number }
  | { type: "ITEM_DONE"; ids: string[]; outputs: ProcessedFile[] }
  | { type: "ITEM_ERROR"; id: string; error: string }
  | { type: "FINISH"; outputs: ProcessedFile[] }
  | { type: "FAIL"; error: string }
  | { type: "CANCEL" }
  | { type: "RESET" };

const initial: ProcessorState = { phase: "idle", items: [], outputs: [] };

const toItem = (file: File): QueueItem => ({
  id: crypto.randomUUID(),
  file,
  status: "queued",
  progress: 0,
  outputs: [],
});

const requeue = (i: QueueItem): QueueItem => ({
  ...i,
  status: "queued",
  progress: 0,
  outputs: [],
  error: undefined,
});

function patch(items: QueueItem[], ids: string[], p: Partial<QueueItem>) {
  const set = new Set(ids);
  return items.map((i) => (set.has(i.id) ? { ...i, ...p } : i));
}

export function reducer(s: ProcessorState, a: Action): ProcessorState {
  const busy = s.phase === "processing";
  switch (a.type) {
    case "ADD": {
      if (busy || !a.files.length) return s;
      // Dropping files after a finished run starts a fresh batch.
      const base = s.phase === "done" ? [] : s.items;
      return { phase: "ready", items: [...base, ...a.files.map(toItem)], outputs: [] };
    }
    case "REMOVE": {
      if (busy) return s;
      const items = s.items.filter((i) => i.id !== a.id);
      return items.length ? { ...s, items } : initial;
    }
    case "REORDER": {
      if (busy) return s;
      const byId = new Map(s.items.map((i) => [i.id, i]));
      const items = a.ids.map((id) => byId.get(id)).filter((i): i is QueueItem => !!i);
      return items.length === s.items.length ? { ...s, items } : s;
    }
    case "START":
      if (busy || !s.items.length) return s;
      return { phase: "processing", items: s.items.map(requeue), outputs: [] };
    case "PROGRESS":
      if (!busy) return s;
      return { ...s, items: patch(s.items, a.ids, { status: "processing", progress: a.progress }) };
    case "ITEM_DONE":
      if (!busy) return s;
      return { ...s, items: patch(s.items, a.ids, { status: "done", progress: 100, outputs: a.outputs }) };
    case "ITEM_ERROR":
      if (!busy) return s;
      return { ...s, items: patch(s.items, [a.id], { status: "error", error: a.error }) };
    case "FINISH": {
      if (!busy) return s;
      const allFailed = s.items.every((i) => i.status === "error");
      return {
        ...s,
        phase: allFailed ? "error" : "done",
        outputs: a.outputs,
        error: allFailed ? "None of the files could be processed." : undefined,
      };
    }
    case "FAIL":
      return { ...s, phase: "error", error: a.error };
    case "CANCEL":
      return { phase: "ready", items: s.items.map(requeue), outputs: [] };
    case "RESET":
      return initial;
  }
}

/** Runs `fn` over `items` with at most `limit` in flight, keeping result order. */
async function pool<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

const toMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function useFileProcessor<O>(processor: Processor<O>, { concurrency = 2 } = {}) {
  const [state, dispatch] = useReducer(reducer, initial);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (opts: O) => {
      const items = state.items;
      if (!items.length || state.phase === "processing") return;

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const { signal } = ctrl;
      dispatch({ type: "START" });

      try {
        if (processor.mode === "combine") {
          const ids = items.map((i) => i.id);
          const outputs = await processor.run(
            items.map((i) => i.file),
            opts,
            { signal, onProgress: (progress) => dispatch({ type: "PROGRESS", ids, progress }) },
          );
          signal.throwIfAborted();
          dispatch({ type: "ITEM_DONE", ids, outputs: [] });
          dispatch({ type: "FINISH", outputs });
        } else {
          const results = await pool(items, concurrency, async (item) => {
            try {
              const out = await processor.run(item.file, opts, {
                signal,
                onProgress: (progress) => dispatch({ type: "PROGRESS", ids: [item.id], progress }),
              });
              signal.throwIfAborted();
              dispatch({ type: "ITEM_DONE", ids: [item.id], outputs: out });
              return out;
            } catch (e) {
              if (signal.aborted) throw e; // cancel stops the whole batch
              dispatch({ type: "ITEM_ERROR", id: item.id, error: toMessage(e) });
              return []; // one bad file doesn't kill the batch
            }
          });
          dispatch({ type: "FINISH", outputs: results.flat() });
        }
      } catch (e) {
        dispatch(signal.aborted ? { type: "CANCEL" } : { type: "FAIL", error: toMessage(e) });
      } finally {
        if (abortRef.current === ctrl) abortRef.current = null;
      }
    },
    [state.items, state.phase, processor, concurrency],
  );

  return {
    state,
    addFiles: useCallback((files: File[]) => dispatch({ type: "ADD", files }), []),
    removeFile: useCallback((id: string) => dispatch({ type: "REMOVE", id }), []),
    reorder: useCallback((ids: string[]) => dispatch({ type: "REORDER", ids }), []),
    run,
    cancel: useCallback(() => abortRef.current?.abort(), []),
    reset: useCallback(() => dispatch({ type: "RESET" }), []),
  };
}
