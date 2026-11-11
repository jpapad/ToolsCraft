"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToolShell } from "@/components/shared/tool-shell";
import { safeFileName } from "@/lib/utils/files";
import { pdfMergeMeta as meta } from "./meta";
import { pdfMergeProcessor } from "./processor";

function PdfIcon() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cat-pdf/10 text-cat-pdf">
      <FileText className="size-5" />
    </div>
  );
}

export default function PdfMergeTool() {
  const [fileName, setFileName] = useState("merged.pdf");

  return (
    <ToolShell
      processor={pdfMergeProcessor}
      options={{ fileName: safeFileName(fileName, "pdf", "merged") }}
      accept={meta.accept}
      maxFiles={meta.maxFiles}
      maxSize={(meta.maxSizeMB ?? 200) * 1024 * 1024}
      minFiles={2}
      sortable
      actionLabel="Merge PDFs"
      zipName="merged.zip"
      dropHint="Select two or more PDFs"
      renderItemPreview={() => <PdfIcon />}
      optionsPanel={
        <div className="space-y-2">
          <Label htmlFor="merge-name">Output file name</Label>
          <Input id="merge-name" value={fileName} onChange={(e) => setFileName(e.target.value)} />
        </div>
      }
    />
  );
}
