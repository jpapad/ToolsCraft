"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileArchive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/utils/download";
import { formatBytes } from "@/lib/utils/files";
import { downloadZip } from "@/lib/utils/zip";
import type { ProcessedFile } from "@/lib/tools/types";

interface ResultPanelProps {
  outputs: ProcessedFile[];
  zipName: string;
  /** Total size of the inputs, to show savings (useful for compressors). */
  inputBytes?: number;
}

export function ResultPanel({ outputs, zipName, inputBytes }: ResultPanelProps) {
  const [zipping, setZipping] = useState(false);
  const total = outputs.reduce((n, o) => n + o.blob.size, 0);
  const saved = inputBytes && inputBytes > total ? Math.round((1 - total / inputBytes) * 100) : 0;

  const zipAll = async () => {
    setZipping(true);
    try {
      await downloadZip(outputs, zipName);
    } catch {
      toast.error("Could not create the ZIP file.");
    } finally {
      setZipping(false);
    }
  };

  if (!outputs.length) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <div>
          <p className="font-medium">Done!</p>
          <p className="text-sm text-muted-foreground">
            {outputs.length === 1 ? "1 file" : `${outputs.length} files`} · {formatBytes(total)}
            {saved > 0 && <span className="text-emerald-600 dark:text-emerald-400"> · {saved}% smaller</span>}
          </p>
        </div>
      </div>

      {outputs.length === 1 ? (
        <Button size="lg" className="h-11 w-full text-base" onClick={() => downloadBlob(outputs[0].blob, outputs[0].name)}>
          <Download /> Download
        </Button>
      ) : (
        <>
          <Button size="lg" className="h-11 w-full text-base" onClick={zipAll} disabled={zipping}>
            {zipping ? <Loader2 className="animate-spin" /> : <FileArchive />} Download all (.zip)
          </Button>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {outputs.map((o, i) => (
              <li key={`${o.name}-${i}`} className="flex items-center gap-2 text-sm">
                <span className="min-w-0 flex-1 truncate" title={o.name}>
                  {o.name}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{formatBytes(o.blob.size)}</span>
                <Button variant="ghost" size="icon-sm" aria-label={`Download ${o.name}`} onClick={() => downloadBlob(o.blob, o.name)}>
                  <Download />
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
