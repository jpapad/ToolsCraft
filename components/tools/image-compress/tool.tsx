"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BeforeAfter, ImageThumb } from "@/components/shared/before-after";
import { ToolShell } from "@/components/shared/tool-shell";
import { createImageProcessor, imageConcurrency } from "@/lib/engines/image/processor";
import type { ImageFormat } from "@/lib/engines/image/formats";
import { MaxDimensionSelect, QualitySlider } from "../image-shared/options";
import { imageCompressMeta as meta } from "./meta";

interface CompressOptions {
  quality: number;
  format: ImageFormat | "keep";
  maxDimension: number;
}

const processor = createImageProcessor<CompressOptions>((_file, o) => ({
  format: o.format,
  quality: o.quality,
  maxDimension: o.maxDimension || undefined,
  keepIfLarger: true,
}));

export default function ImageCompressTool() {
  const [opts, setOpts] = useState<CompressOptions>({ quality: 75, format: "keep", maxDimension: 0 });
  const set = (patch: Partial<CompressOptions>) => setOpts((o) => ({ ...o, ...patch }));

  return (
    <ToolShell
      processor={processor}
      options={opts}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 50) * 1024 * 1024}
      concurrency={imageConcurrency()}
      actionLabel="Compress"
      zipName="compressed-images.zip"
      showSavings
      renderItemPreview={(item) => <ImageThumb file={item.file} />}
      renderResult={(items) => <BeforeAfter items={items} />}
      optionsPanel={
        <div className="space-y-5">
          {opts.format !== "png" && <QualitySlider value={opts.quality} onChange={(quality) => set({ quality })} />}
          <div className="space-y-2">
            <Label htmlFor="out-format">Output format</Label>
            <Select value={opts.format} onValueChange={(v) => set({ format: v as CompressOptions["format"] })}>
              <SelectTrigger id="out-format" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="keep">Same as original</SelectItem>
                <SelectItem value="webp">WebP (smaller, recommended)</SelectItem>
                <SelectItem value="avif">AVIF (smallest, slower)</SelectItem>
                <SelectItem value="jpeg">JPG</SelectItem>
                <SelectItem value="png">PNG (lossless)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <MaxDimensionSelect value={opts.maxDimension} onChange={(maxDimension) => set({ maxDimension })} />
        </div>
      }
    />
  );
}
