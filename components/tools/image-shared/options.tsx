"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

export function QualitySlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const hint = value >= 85 ? "Best quality" : value >= 65 ? "Balanced (recommended)" : value >= 40 ? "Smaller files" : "Smallest files";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="quality">Quality</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{value}</span>
      </div>
      <Slider id="quality" min={10} max={100} step={1} value={[value]} onValueChange={([v]) => onChange(v)} />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

const SIZES = [
  { value: "0", label: "Original size" },
  { value: "3840", label: "Max 3840 px (4K)" },
  { value: "2560", label: "Max 2560 px" },
  { value: "1920", label: "Max 1920 px (Full HD)" },
  { value: "1280", label: "Max 1280 px" },
  { value: "800", label: "Max 800 px" },
];

export function MaxDimensionSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="max-dim">Resize</Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="max-dim" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIZES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Only shrinks larger images. Never upscales.</p>
    </div>
  );
}
