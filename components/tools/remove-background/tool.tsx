"use client";

import { useEffect, useState } from "react";
import { Cpu, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { BeforeAfter, ImageThumb } from "@/components/shared/before-after";
import { ToolShell } from "@/components/shared/tool-shell";
import { cn } from "@/lib/utils";
import { removeBackgroundMeta as meta } from "./meta";
import { modelChain, MODELS, type ModelKey } from "./models";
import { backgroundProcessor } from "./processor";

const SWATCHES: { label: string; value: string | null }[] = [
  { label: "Transparent", value: null },
  { label: "White", value: "#ffffff" },
  { label: "Black", value: "#000000" },
  { label: "Light gray", value: "#f1f5f9" },
];

export default function RemoveBackgroundTool() {
  const [background, setBackground] = useState<string | null>(null);
  const [custom, setCustom] = useState("#6366f1");
  const [model, setModel] = useState<ModelKey | null>(null);

  useEffect(() => {
    let alive = true;
    // Same first choice the processor will make; checked here only to explain it.
    modelChain().then(([m]) => alive && setModel(m));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ToolShell
      processor={backgroundProcessor}
      options={{ background }}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 30) * 1024 * 1024}
      concurrency={1}
      actionLabel="Remove background"
      zipName="no-background.zip"
      renderItemPreview={(item) => <ImageThumb file={item.file} />}
      renderResult={(items) => <BeforeAfter items={items} />}
      optionsPanel={
        <div className="space-y-5">
          <div className="space-y-2">
            <Label id="bg-label">Background</Label>
            <div role="radiogroup" aria-labelledby="bg-label" className="flex flex-wrap gap-2">
              {SWATCHES.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  role="radio"
                  aria-checked={background === s.value}
                  aria-label={s.label}
                  title={s.label}
                  onClick={() => setBackground(s.value)}
                  className={cn(
                    "size-9 rounded-lg border-2 transition-shadow",
                    background === s.value ? "border-primary ring-2 ring-primary/30" : "border-border",
                    s.value === null &&
                      "bg-[conic-gradient(var(--muted)_25%,transparent_0_50%,var(--muted)_0_75%,transparent_0)] bg-[length:10px_10px]",
                  )}
                  style={s.value ? { background: s.value } : undefined}
                />
              ))}
              <label
                title="Custom color"
                className={cn(
                  "relative size-9 cursor-pointer overflow-hidden rounded-lg border-2",
                  background === custom ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
                style={{ background: custom }}
              >
                <input
                  type="color"
                  aria-label="Custom background color"
                  value={custom}
                  onChange={(e) => {
                    setCustom(e.target.value);
                    setBackground(e.target.value);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>

          <div className="space-y-1.5 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              {model && MODELS[model].gpu ? <Zap className="size-3.5 text-amber-500" /> : <Cpu className="size-3.5" />}
              {model === null ? "Checking your device…" : MODELS[model].gpu ? "GPU acceleration available" : "Running on CPU (slower)"}
            </p>
            <p>
              The first run downloads the AI model (about {model ? MODELS[model].sizeMB : 100} MB). It’s saved in your browser, so
              next time it starts right away.
              {model && model !== "birefnet-gpu" && " On this device a lighter model is used, which works best on photos of people."}
            </p>
          </div>
        </div>
      }
    />
  );
}
