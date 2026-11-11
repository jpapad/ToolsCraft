"use client";

import { useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Download, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { imageAccept, type ImageFormat } from "@/lib/engines/image/formats";
import { runImageJob } from "@/lib/engines/image/processor";
import { downloadBlob } from "@/lib/utils/download";
import { cn } from "@/lib/utils";
import { FormatSelect } from "./format-select";

const RATIOS: { label: string; value: number | "original" }[] = [
  { label: "Original", value: "original" },
  { label: "1:1", value: 1 },
  { label: "4:3", value: 4 / 3 },
  { label: "3:2", value: 3 / 2 },
  { label: "16:9", value: 16 / 9 },
  { label: "4:5", value: 4 / 5 },
  { label: "9:16", value: 9 / 16 },
];

export function CropPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const urlRef = useRef("");
  const [natural, setNatural] = useState({ width: 1, height: 1 });
  const [ratio, setRatio] = useState<number | "original">("original");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [format, setFormat] = useState<ImageFormat | "keep">("keep");
  const [busy, setBusy] = useState(false);

  const choose = (f: File | null) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = f ? URL.createObjectURL(f) : "";
    setUrl(urlRef.current);
    setFile(f);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setArea(null);
  };

  const run = async () => {
    if (!file || !area) return;
    setBusy(true);
    try {
      const out = await runImageJob(file, { format, quality: 90, crop: area }, new AbortController().signal);
      downloadBlob(out.blob, out.name.replace(/(\.[^.]+)$/, "-cropped$1"));
      toast.success(`Cropped to ${out.width} × ${out.height} px.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not crop the image.");
    } finally {
      setBusy(false);
    }
  };

  if (!file) {
    return <FileDropzone onFiles={([f]) => f && choose(f)} accept={imageAccept} multiple={false} maxSize={50 * 1024 * 1024} />;
  }

  const aspect = ratio === "original" ? natural.width / natural.height : ratio;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="relative h-[60vh] min-h-80 overflow-hidden rounded-xl border bg-muted">
        <Cropper
          image={url}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, px) => setArea(px)}
          onMediaLoaded={(m) => setNatural({ width: m.naturalWidth, height: m.naturalHeight })}
        />
      </div>

      <aside className="space-y-5 rounded-xl border bg-card p-5 shadow-xs lg:sticky lg:top-20">
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</p>
          <Button variant="ghost" size="icon-sm" aria-label="Choose another image" onClick={() => choose(null)}>
            <X />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Aspect ratio</Label>
          <div className="flex flex-wrap gap-1.5">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRatio(r.value)}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-sm transition-colors",
                  ratio === r.value ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label htmlFor="zoom">Zoom</Label>
          <Slider id="zoom" min={1} max={4} step={0.05} value={[zoom]} onValueChange={([z]) => setZoom(z)} />
        </div>

        <FormatSelect value={format} onChange={setFormat} />

        {area && (
          <p className="text-sm text-muted-foreground tabular-nums">
            Result: {Math.round(area.width)} × {Math.round(area.height)} px
          </p>
        )}

        <Button size="lg" className="h-11 w-full text-base" onClick={run} disabled={busy || !area}>
          {busy ? <Loader2 className="animate-spin" /> : <Download />} Crop & download
        </Button>
      </aside>
    </div>
  );
}
