"use client";

import { useState } from "react";
import { ReactCompareSlider } from "react-compare-slider";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/files";
import type { QueueItem } from "@/lib/hooks/use-file-processor";
import { BlobImage } from "./blob-image";

const checkerboard =
  "bg-[conic-gradient(var(--muted)_25%,transparent_0_50%,var(--muted)_0_75%,transparent_0)] bg-[length:16px_16px]";

/** Drag-to-compare view of the original vs. the result, for image tools. */
export function BeforeAfter({ items }: { items: QueueItem[] }) {
  const done = items.filter((i) => i.status === "done" && i.outputs.length > 0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const current = done.find((i) => i.id === selectedId) ?? done[0];
  if (!current) return null;

  const out = current.outputs[0];
  const change = Math.round((out.blob.size / current.file.size - 1) * 100);

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium">Compare</span>
        <span className="text-muted-foreground tabular-nums">
          {formatBytes(current.file.size)} → {formatBytes(out.blob.size)}{" "}
          <span className={cn(change <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600")}>
            ({change > 0 ? "+" : ""}
            {change}%)
          </span>
        </span>
      </div>

      <div className={cn("overflow-hidden rounded-lg border", checkerboard)}>
        <ReactCompareSlider
          key={current.id}
          className="max-h-[32rem]"
          itemOne={
            <BlobImage blob={current.file} alt="Original" className="block max-h-[32rem] w-full object-contain" />
          }
          itemTwo={<BlobImage blob={out.blob} alt="Result" className="block max-h-[32rem] w-full object-contain" />}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>← Original</span>
        <span>Result →</span>
      </div>

      {done.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Choose image to compare">
          {done.map((i) => (
            <button
              key={i.id}
              type="button"
              role="option"
              aria-selected={i.id === current.id}
              onClick={() => setSelectedId(i.id)}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-md border-2",
                i.id === current.id ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              <BlobImage blob={i.outputs[0].blob} alt={i.file.name} className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ImageThumb({ file }: { file: File }) {
  return (
    <div className={cn("size-10 shrink-0 overflow-hidden rounded-md border", checkerboard)}>
      <BlobImage blob={file} alt="" loading="lazy" className="size-full object-cover" />
    </div>
  );
}
