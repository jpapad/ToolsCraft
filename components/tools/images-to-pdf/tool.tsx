"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageThumb } from "@/components/shared/before-after";
import { ToolShell } from "@/components/shared/tool-shell";
import { safeFileName } from "@/lib/utils/files";
import type { Orientation, PageSize } from "./layout";
import { imagesToPdfMeta as meta } from "./meta";
import { imagesToPdfProcessor } from "./processor";

function Field({ id, label, value, onChange, options }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ImagesToPdfTool() {
  const [pageSize, setPageSize] = useState<PageSize>("a4");
  const [orientation, setOrientation] = useState<Orientation>("auto");
  const [margin, setMargin] = useState(20);
  const [fileName, setFileName] = useState("images.pdf");

  return (
    <ToolShell
      processor={imagesToPdfProcessor}
      options={{ pageSize, orientation, margin, fileName: safeFileName(fileName, "pdf", "images") }}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 50) * 1024 * 1024}
      sortable
      actionLabel="Create PDF"
      zipName="images-pdf.zip"
      renderItemPreview={(item) => <ImageThumb file={item.file} />}
      optionsPanel={
        <div className="space-y-4">
          <Field
            id="page-size"
            label="Page size"
            value={pageSize}
            onChange={(v) => setPageSize(v as PageSize)}
            options={[["a4", "A4"], ["letter", "US Letter"], ["fit", "Same as image"]]}
          />
          {pageSize !== "fit" && (
            <Field
              id="orientation"
              label="Orientation"
              value={orientation}
              onChange={(v) => setOrientation(v as Orientation)}
              options={[["auto", "Automatic (per image)"], ["portrait", "Portrait"], ["landscape", "Landscape"]]}
            />
          )}
          <Field
            id="margin"
            label="Margin"
            value={String(margin)}
            onChange={(v) => setMargin(Number(v))}
            options={[["0", "None"], ["20", "Small"], ["40", "Large"]]}
          />
          <div className="space-y-2">
            <Label htmlFor="pdf-name">File name</Label>
            <Input id="pdf-name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
        </div>
      }
    />
  );
}
