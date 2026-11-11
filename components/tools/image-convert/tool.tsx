"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeforeAfter, ImageThumb } from "@/components/shared/before-after";
import { ToolShell } from "@/components/shared/tool-shell";
import { createImageProcessor, imageConcurrency } from "@/lib/engines/image/processor";
import { imageFormats, type ImageFormat } from "@/lib/engines/image/formats";
import { MaxDimensionSelect, QualitySlider } from "../image-shared/options";
import { imageConvertMeta as meta } from "./meta";

interface ConvertOptions {
  format: ImageFormat;
  quality: number;
  maxDimension: number;
}

const processor = createImageProcessor<ConvertOptions>((_file, o) => ({
  format: o.format,
  quality: o.quality,
  maxDimension: o.maxDimension || undefined,
}));

const ORDER: ImageFormat[] = ["webp", "png", "jpeg", "avif"];

export default function ImageConvertTool() {
  const [opts, setOpts] = useState<ConvertOptions>({ format: "webp", quality: 85, maxDimension: 0 });
  const set = (patch: Partial<ConvertOptions>) => setOpts((o) => ({ ...o, ...patch }));
  const label = imageFormats[opts.format].label;

  return (
    <ToolShell
      processor={processor}
      options={opts}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 50) * 1024 * 1024}
      concurrency={imageConcurrency()}
      actionLabel={`Convert to ${label}`}
      zipName={`converted-${imageFormats[opts.format].ext}.zip`}
      renderItemPreview={(item) => <ImageThumb file={item.file} />}
      renderResult={(items) => <BeforeAfter items={items} />}
      optionsPanel={
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Convert to</Label>
            <Tabs value={opts.format} onValueChange={(v) => set({ format: v as ImageFormat })}>
              <TabsList className="w-full">
                {ORDER.map((f) => (
                  <TabsTrigger key={f} value={f}>
                    {imageFormats[f].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {opts.format === "jpeg" && (
              <p className="text-xs text-muted-foreground">Transparent areas will become white.</p>
            )}
          </div>
          {imageFormats[opts.format].lossy && (
            <QualitySlider value={opts.quality} onChange={(quality) => set({ quality })} />
          )}
          <MaxDimensionSelect value={opts.maxDimension} onChange={(maxDimension) => set({ maxDimension })} />
        </div>
      }
    />
  );
}
