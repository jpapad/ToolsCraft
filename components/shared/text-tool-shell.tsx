"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Download, Eraser } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { downloadBlob } from "@/lib/utils/download";

export type TextResult = { ok: true; value: string } | { ok: false; error: string };

interface TextToolShellProps {
  input: string;
  onInputChange: (value: string) => void;
  result: TextResult;
  inputLabel?: string;
  outputLabel?: string;
  placeholder?: string;
  /** Toolbar above the panes (mode switches, options). */
  toolbar?: ReactNode;
  downloadName?: string;
  downloadType?: string;
  mono?: boolean;
}

/** Shared two-pane layout for text tools: input on the left, live output on the right. */
export function TextToolShell({
  input,
  onInputChange,
  result,
  inputLabel = "Input",
  outputLabel = "Output",
  placeholder,
  toolbar,
  downloadName,
  downloadType = "text/plain",
  mono = true,
}: TextToolShellProps) {
  const [copied, setCopied] = useState(false);
  const output = result.ok ? result.value : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed. Your browser blocked clipboard access.");
    }
  };

  const paneClass = cn("min-h-80 resize-y text-sm leading-relaxed lg:min-h-[28rem]", mono && "font-mono");

  return (
    <div className="space-y-4">
      {toolbar && <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">{toolbar}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <div className="flex h-8 items-center justify-between">
            <Label htmlFor="tool-input">{inputLabel}</Label>
            <Button variant="ghost" size="sm" onClick={() => onInputChange("")} disabled={!input}>
              <Eraser /> Clear
            </Button>
          </div>
          <Textarea
            id="tool-input"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            className={paneClass}
          />
        </div>

        <div className="space-y-2">
          <div className="flex h-8 items-center justify-between">
            <Label htmlFor="tool-output">{outputLabel}</Label>
            <div className="flex gap-1">
              {downloadName && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!output}
                  onClick={() => downloadBlob(new Blob([output], { type: downloadType }), downloadName)}
                >
                  <Download /> Download
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={copy} disabled={!output}>
                {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
          <Textarea
            id="tool-output"
            value={output}
            readOnly
            spellCheck={false}
            aria-invalid={!result.ok || undefined}
            className={cn(paneClass, "bg-muted/40")}
          />
          {!result.ok && (
            <p role="alert" className="text-sm text-destructive">
              {result.error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
