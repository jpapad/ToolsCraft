"use client";

import { useState } from "react";
import { FileText, ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BlobImage } from "@/components/shared/blob-image";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { ToolShell } from "@/components/shared/tool-shell";
import { imageAccept } from "@/lib/engines/image/formats";
import { pdfWatermarkMeta as meta } from "./meta";
import { pdfWatermarkProcessor, type WatermarkOptions } from "./processor";

function LabeledSlider(props: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label htmlFor={props.id}>{props.label}</Label>
        <span className="text-sm tabular-nums text-muted-foreground">{props.format(props.value)}</span>
      </div>
      <Slider
        id={props.id}
        min={props.min}
        max={props.max}
        step={props.step ?? 1}
        value={[props.value]}
        onValueChange={([v]) => props.onChange(v)}
      />
    </div>
  );
}

export default function PdfWatermarkTool() {
  const [o, setO] = useState<WatermarkOptions>({
    kind: "text",
    text: "CONFIDENTIAL",
    color: "#dc2626",
    image: null,
    opacity: 0.25,
    widthRatio: 0.7,
    angle: 45,
    layout: "center",
  });
  const set = (patch: Partial<WatermarkOptions>) => setO((prev) => ({ ...prev, ...patch }));
  const missing = o.kind === "text" ? !o.text.trim() : !o.image;

  return (
    <ToolShell
      processor={pdfWatermarkProcessor}
      options={o}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 200) * 1024 * 1024}
      actionLabel="Add watermark"
      actionDisabled={missing}
      zipName="watermarked-pdfs.zip"
      renderItemPreview={() => (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf/10 text-cat-pdf">
          <FileText className="size-5" />
        </div>
      )}
      optionsPanel={
        <div className="space-y-5">
          <Tabs value={o.kind} onValueChange={(v) => set({ kind: v as WatermarkOptions["kind"] })}>
            <TabsList className="w-full">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="image">Image / logo</TabsTrigger>
            </TabsList>
          </Tabs>

          {o.kind === "text" ? (
            <div className="space-y-2">
              <Label htmlFor="wm-text">Text</Label>
              <div className="flex gap-2">
                <Input id="wm-text" value={o.text} onChange={(e) => set({ text: e.target.value })} />
                <input
                  type="color"
                  aria-label="Text color"
                  value={o.color}
                  onChange={(e) => set({ color: e.target.value })}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded-lg border bg-transparent p-1"
                />
              </div>
            </div>
          ) : o.image ? (
            <div className="flex items-center gap-3 rounded-lg border p-2">
              <BlobImage blob={o.image} alt="" className="size-10 rounded object-contain" />
              <span className="min-w-0 flex-1 truncate text-sm">{o.image.name}</span>
              <Button variant="ghost" size="icon-sm" aria-label="Remove image" onClick={() => set({ image: null })}>
                <X />
              </Button>
            </div>
          ) : (
            <FileDropzone compact paste={false} multiple={false} accept={imageAccept} onFiles={([f]) => f && set({ image: f })} />
          )}

          <div className="space-y-2">
            <Label>Layout</Label>
            <Tabs value={o.layout} onValueChange={(v) => set({ layout: v as WatermarkOptions["layout"] })}>
              <TabsList className="w-full">
                <TabsTrigger value="center">Centered</TabsTrigger>
                <TabsTrigger value="tile">Tiled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <LabeledSlider id="wm-size" label="Size" value={o.widthRatio} min={0.1} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(widthRatio) => set({ widthRatio })} />
          <LabeledSlider id="wm-angle" label="Angle" value={o.angle} min={-90} max={90} step={5} format={(v) => `${v}°`} onChange={(angle) => set({ angle })} />
          <LabeledSlider id="wm-opacity" label="Opacity" value={o.opacity} min={0.05} max={1} step={0.05} format={(v) => `${Math.round(v * 100)}%`} onChange={(opacity) => set({ opacity })} />
          {o.kind === "image" && !o.image && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ImageIcon className="size-3.5" /> PNG with transparency works best.
            </p>
          )}
        </div>
      }
    />
  );
}
