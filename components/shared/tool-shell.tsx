"use client";

import type { ReactNode } from "react";
import type { Accept } from "react-dropzone";
import { CircleAlert, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useFileProcessor, type QueueItem } from "@/lib/hooks/use-file-processor";
import type { Processor } from "@/lib/tools/types";
import { FileDropzone } from "./file-dropzone";
import { FileQueue } from "./file-queue";
import { ResultPanel } from "./result-panel";

export interface ToolShellProps<O> {
  processor: Processor<O>;
  options: O;
  actionLabel: string;
  /** Disable the action button, e.g. while an option is invalid. */
  actionDisabled?: boolean;
  zipName: string;
  accept?: Accept;
  multiple?: boolean;
  /** Minimum files before the action is enabled (e.g. 2 for merge). */
  minFiles?: number;
  maxFiles?: number;
  maxSize?: number;
  sortable?: boolean;
  concurrency?: number;
  dropHint?: string;
  showSavings?: boolean;
  optionsPanel?: ReactNode;
  renderItemPreview?: (item: QueueItem) => ReactNode;
  renderResult?: (items: QueueItem[]) => ReactNode;
}

/**
 * Shared UI for every file-based tool:
 * idle → dropzone · ready → queue + options · processing → progress · done → downloads.
 */
export function ToolShell<O>(p: ToolShellProps<O>) {
  const { state, addFiles, removeFile, reorder, run, cancel, reset } = useFileProcessor(p.processor, {
    concurrency: p.concurrency,
  });
  const { phase, items, outputs } = state;
  const busy = phase === "processing";
  const minFiles = p.minFiles ?? 1;
  const overall = items.length ? items.reduce((n, i) => n + i.progress, 0) / items.length : 0;
  const inputBytes = items.reduce((n, i) => n + i.file.size, 0);
  const canAddMore = p.multiple !== false && (!p.maxFiles || items.length < p.maxFiles);

  if (phase === "idle") {
    return (
      <FileDropzone
        onFiles={addFiles}
        accept={p.accept}
        multiple={p.multiple}
        maxFiles={p.maxFiles}
        maxSize={p.maxSize}
        hint={p.dropHint}
      />
    );
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="space-y-3" aria-label="Files">
        {p.sortable && items.length > 1 && !busy && phase !== "done" && (
          <p className="text-sm text-muted-foreground">Drag the handles to set the order.</p>
        )}
        <FileQueue
          items={items}
          sortable={p.sortable && !busy && phase !== "done"}
          onRemove={busy ? undefined : removeFile}
          onReorder={reorder}
          renderPreview={p.renderItemPreview}
        />
        {!busy && phase !== "done" && canAddMore && (
          <FileDropzone
            compact
            onFiles={addFiles}
            accept={p.accept}
            maxSize={p.maxSize}
            maxFiles={p.maxFiles ? p.maxFiles - items.length : undefined}
          />
        )}
        {phase === "done" && p.renderResult?.(items)}
      </section>

      <aside className="space-y-5 rounded-xl border bg-card p-5 shadow-xs lg:sticky lg:top-20">
        {(phase === "ready" || phase === "error") && p.optionsPanel}

        {phase === "error" && state.error && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" /> {state.error}
          </p>
        )}

        {(phase === "ready" || phase === "error") && (
          <div className="space-y-2">
            <Button
              size="lg"
              className="h-11 w-full text-base"
              disabled={items.length < minFiles || p.actionDisabled}
              onClick={() => run(p.options)}
            >
              {phase === "error" ? "Try again" : p.actionLabel}
            </Button>
            {items.length < minFiles && (
              <p className="text-center text-xs text-muted-foreground">Add at least {minFiles} files to continue.</p>
            )}
          </div>
        )}

        {busy && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Processing…</span>
              <span className="tabular-nums text-muted-foreground">{Math.round(overall)}%</span>
            </div>
            <Progress value={overall} className="h-2" />
            <Button variant="outline" className="w-full" onClick={cancel}>
              <X /> Cancel
            </Button>
          </div>
        )}

        {phase === "done" && (
          <ResultPanel outputs={outputs} zipName={p.zipName} inputBytes={p.showSavings ? inputBytes : undefined} />
        )}

        {(phase === "done" || phase === "error") && (
          <Button variant="ghost" className="w-full" onClick={reset}>
            <RotateCcw /> Start over
          </Button>
        )}
      </aside>
    </div>
  );
}
