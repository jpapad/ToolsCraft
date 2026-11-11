"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/shared/tool-shell";
import { cn } from "@/lib/utils";
import type { CompressLevel } from "./compress";
import { pdfCompressMeta as meta } from "./meta";
import { pdfCompressProcessor } from "./processor";

const OPTIONS: { value: CompressLevel; title: string; text: string }[] = [
  { value: "light", title: "Light", text: "Best quality, smaller savings" },
  { value: "recommended", title: "Recommended", text: "Good quality, much smaller" },
  { value: "strong", title: "Strong", text: "Smallest file, lower image quality" },
];

export default function PdfCompressTool() {
  const [level, setLevel] = useState<CompressLevel>("recommended");

  return (
    <ToolShell
      processor={pdfCompressProcessor}
      options={{ level }}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 300) * 1024 * 1024}
      concurrency={1}
      actionLabel="Compress PDF"
      zipName="compressed-pdfs.zip"
      showSavings
      renderItemPreview={() => (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf/10 text-cat-pdf">
          <FileText className="size-5" />
        </div>
      )}
      optionsPanel={
        <div className="space-y-2">
          <Label id="level-label">Compression level</Label>
          <div role="radiogroup" aria-labelledby="level-label" className="space-y-2">
            {OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={level === o.value}
                onClick={() => setLevel(o.value)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  level === o.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted",
                )}
              >
                <p className="text-sm font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">{o.text}</p>
              </button>
            ))}
          </div>
        </div>
      }
    />
  );
}
