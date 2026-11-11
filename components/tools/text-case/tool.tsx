"use client";

import { useDeferredValue, useState } from "react";
import { Check, Copy, Eraser } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cases, textStats } from "./convert";

function CaseCard({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed. Your browser blocked clipboard access.");
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Button variant="ghost" size="xs" onClick={copy} disabled={!value} aria-label={`Copy ${label}`}>
          {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="line-clamp-3 min-h-5 font-mono text-sm break-words whitespace-pre-wrap">
        {value || <span className="text-muted-foreground/60">—</span>}
      </p>
    </div>
  );
}

export default function TextCaseTool() {
  const [text, setText] = useState("");
  const deferred = useDeferredValue(text);
  const stats = textStats(text);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex h-8 items-center justify-between">
          <Label htmlFor="case-input">Your text</Label>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {stats.characters} characters · {stats.words} words · {stats.lines} lines
            </span>
            <Button variant="ghost" size="sm" onClick={() => setText("")} disabled={!text}>
              <Eraser /> Clear
            </Button>
          </div>
        </div>
        <Textarea
          id="case-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type or paste text, e.g. “user profile settings”"
          className="min-h-36 text-base"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((c) => (
          <CaseCard key={c.id} label={c.label} value={deferred ? c.convert(deferred) : ""} />
        ))}
      </div>
    </div>
  );
}
