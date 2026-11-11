"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolShell } from "@/components/shared/tool-shell";
import { pdfSplitMeta as meta } from "./meta";
import { pdfSplitProcessor } from "./processor";
import { isValidRangeSyntax } from "@/lib/engines/pdf/ranges";
import type { SplitMode } from "./split";

const HINTS: Record<SplitMode, string> = {
  all: "Every page becomes its own PDF.",
  ranges: "Each range becomes a separate PDF.",
  extract: "The selected pages are combined into one PDF.",
};

export default function PdfSplitTool() {
  const [mode, setMode] = useState<SplitMode>("all");
  const [ranges, setRanges] = useState("1-3, 5");
  const invalid = mode !== "all" && !isValidRangeSyntax(ranges);

  return (
    <ToolShell
      processor={pdfSplitProcessor}
      options={{ mode, ranges }}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 200) * 1024 * 1024}
      actionLabel="Split PDF"
      actionDisabled={invalid}
      zipName="split-pdf.zip"
      renderItemPreview={() => (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf/10 text-cat-pdf">
          <FileText className="size-5" />
        </div>
      )}
      optionsPanel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Split mode</Label>
            <Tabs value={mode} onValueChange={(v) => setMode(v as SplitMode)}>
              <TabsList className="w-full">
                <TabsTrigger value="all">Every page</TabsTrigger>
                <TabsTrigger value="ranges">Ranges</TabsTrigger>
                <TabsTrigger value="extract">Extract</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-xs text-muted-foreground">{HINTS[mode]}</p>
          </div>
          {mode !== "all" && (
            <div className="space-y-2">
              <Label htmlFor="ranges">Pages</Label>
              <Input
                id="ranges"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder="e.g. 1-3, 5, 8-"
                aria-invalid={invalid || undefined}
              />
              <p className={invalid ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                {invalid ? "Use numbers, dashes and commas, e.g. 1-3, 5, 8-" : "“8-” means page 8 to the end."}
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}
