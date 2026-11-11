"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ImageFormat } from "@/lib/engines/image/formats";

export function FormatSelect({ value, onChange }: { value: ImageFormat | "keep"; onChange: (v: ImageFormat | "keep") => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="out-format">Save as</Label>
      <Select value={value} onValueChange={(v) => onChange(v as ImageFormat | "keep")}>
        <SelectTrigger id="out-format" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="keep">Same as original</SelectItem>
          <SelectItem value="jpeg">JPG</SelectItem>
          <SelectItem value="png">PNG</SelectItem>
          <SelectItem value="webp">WebP</SelectItem>
          <SelectItem value="avif">AVIF</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
