"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToolShell } from "@/components/shared/tool-shell";
import { isValidRangeSyntax } from "@/lib/engines/pdf/ranges";
import { pdfToImagesMeta as meta } from "./meta";
import { pdfToImagesProcessor, type PdfToImagesOptions } from "./processor";

export default function PdfToImagesTool() {
  const [format, setFormat] = useState<PdfToImagesOptions["format"]>("png");
  const [dpi, setDpi] = useState(150);
  const [pages, setPages] = useState("");
  const invalid = pages.trim() !== "" && !isValidRangeSyntax(pages);

  return (
    <ToolShell
      processor={pdfToImagesProcessor}
      options={{ format, dpi, pages }}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 200) * 1024 * 1024}
      concurrency={1}
      actionLabel="Convert to images"
      actionDisabled={invalid}
      zipName="pdf-images.zip"
      renderItemPreview={() => (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf/10 text-cat-pdf">
          <FileText className="size-5" />
        </div>
      )}
      optionsPanel={
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Image format</Label>
            <Tabs value={format} onValueChange={(v) => setFormat(v as PdfToImagesOptions["format"])}>
              <TabsList className="w-full">
                <TabsTrigger value="png">PNG</TabsTrigger>
                <TabsTrigger value="jpeg">JPG</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-2">
            <Label>Resolution</Label>
            <Tabs value={String(dpi)} onValueChange={(v) => setDpi(Number(v))}>
              <TabsList className="w-full">
                <TabsTrigger value="72">72 DPI</TabsTrigger>
                <TabsTrigger value="150">150 DPI</TabsTrigger>
                <TabsTrigger value="300">300 DPI</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pages">Pages (optional)</Label>
            <Input
              id="pages"
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="All pages, or e.g. 1-3, 5"
              aria-invalid={invalid || undefined}
            />
            {invalid && <p className="text-xs text-destructive">Use numbers, dashes and commas, e.g. 1-3, 5</p>}
          </div>
        </div>
      }
    />
  );
}
