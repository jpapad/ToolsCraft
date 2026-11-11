"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageThumb } from "@/components/shared/before-after";
import { ToolShell } from "@/components/shared/tool-shell";
import type { ImageFormat } from "@/lib/engines/image/formats";
import { createImageProcessor, imageConcurrency } from "@/lib/engines/image/processor";
import { CropPanel } from "./crop-panel";
import { FormatSelect } from "./format-select";
import { imageResizeMeta as meta } from "./meta";

interface ResizeOptions {
  mode: "percent" | "pixels";
  percent: number;
  width: string;
  height: string;
  keepAspect: boolean;
  format: ImageFormat | "keep";
}

const toPx = (v: string) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

const processor = createImageProcessor<ResizeOptions>((_f, o) => ({
  format: o.format,
  quality: 90,
  resize:
    o.mode === "percent"
      ? { mode: "percent", percent: o.percent }
      : { mode: "pixels", width: toPx(o.width), height: toPx(o.height), keepAspect: o.keepAspect },
}));

function ResizePanel() {
  const [o, setO] = useState<ResizeOptions>({
    mode: "pixels",
    percent: 50,
    width: "1920",
    height: "",
    keepAspect: true,
    format: "keep",
  });
  const set = (patch: Partial<ResizeOptions>) => setO((p) => ({ ...p, ...patch }));
  const invalid = o.mode === "pixels" && !toPx(o.width) && !toPx(o.height);

  return (
    <ToolShell
      processor={processor}
      options={o}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 50) * 1024 * 1024}
      concurrency={imageConcurrency()}
      actionLabel="Resize"
      actionDisabled={invalid}
      zipName="resized-images.zip"
      renderItemPreview={(item) => <ImageThumb file={item.file} />}
      optionsPanel={
        <div className="space-y-5">
          <Tabs value={o.mode} onValueChange={(v) => set({ mode: v as ResizeOptions["mode"] })}>
            <TabsList className="w-full">
              <TabsTrigger value="pixels">By pixels</TabsTrigger>
              <TabsTrigger value="percent">By percent</TabsTrigger>
            </TabsList>
          </Tabs>

          {o.mode === "percent" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="percent">Scale</Label>
                <span className="text-sm tabular-nums text-muted-foreground">{o.percent}%</span>
              </div>
              <Slider id="percent" min={5} max={300} step={5} value={[o.percent]} onValueChange={([percent]) => set({ percent })} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="w">Width (px)</Label>
                  <Input id="w" inputMode="numeric" value={o.width} onChange={(e) => set({ width: e.target.value })} placeholder="Auto" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="h">Height (px)</Label>
                  <Input id="h" inputMode="numeric" value={o.height} onChange={(e) => set({ height: e.target.value })} placeholder="Auto" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="aspect" checked={o.keepAspect} onCheckedChange={(keepAspect) => set({ keepAspect })} />
                <Label htmlFor="aspect">Keep aspect ratio</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                {invalid
                  ? "Enter a width, a height, or both."
                  : o.keepAspect
                    ? "Leave one side empty to scale proportionally. With both, images fit inside the box."
                    : "Images are stretched to exactly this size."}
              </p>
            </div>
          )}

          <FormatSelect value={o.format} onChange={(format) => set({ format })} />
        </div>
      }
    />
  );
}

export default function ImageResizeTool() {
  const [tab, setTab] = useState<"resize" | "crop">("resize");
  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "resize" | "crop")}>
        <TabsList>
          <TabsTrigger value="resize">Resize</TabsTrigger>
          <TabsTrigger value="crop">Crop</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "resize" ? <ResizePanel /> : <CropPanel />}
    </div>
  );
}
