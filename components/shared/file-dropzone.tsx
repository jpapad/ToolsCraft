"use client";

import { useEffect } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { ShieldCheck, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils/files";

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  compact?: boolean;
  hint?: string;
  /** Listen for Ctrl/Cmd+V. Turn off when two dropzones are on screen. */
  paste?: boolean;
}

/** Checks a file against a react-dropzone `accept` map (used for pasted files). */
function matchesAccept(file: File, accept?: Accept) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return Object.entries(accept).some(([mime, exts]) => {
    const mimeOk = mime.endsWith("/*") ? file.type.startsWith(mime.slice(0, -1)) : file.type === mime;
    const list: readonly string[] = typeof exts === "string" ? [exts] : exts;
    return mimeOk || list.some((ext) => name.endsWith(ext.toLowerCase()));
  });
}

export function FileDropzone({
  onFiles,
  accept,
  multiple = true,
  maxFiles,
  maxSize,
  disabled,
  compact,
  hint,
  paste = true,
}: FileDropzoneProps) {
  const onDropRejected = (rejections: FileRejection[]) => {
    for (const r of rejections.slice(0, 3)) {
      toast.error(`${r.file.name}: ${r.errors[0]?.message ?? "not supported"}`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    multiple,
    maxFiles,
    maxSize,
    disabled,
    onDropAccepted: onFiles,
    onDropRejected,
  });

  useEffect(() => {
    if (disabled || !paste) return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable]")) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter(
        (f) => matchesAccept(f, accept) && (!maxSize || f.size <= maxSize),
      );
      if (!files.length) return;
      e.preventDefault();
      onFiles(multiple ? files : files.slice(0, 1));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [disabled, paste, onFiles, accept, maxSize, multiple]);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "group flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 text-center transition-colors",
        "hover:border-primary/50 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        compact ? "gap-2 p-4" : "min-h-72 flex-col gap-4 p-10",
        isDragActive && "border-primary bg-primary/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input {...getInputProps()} />
      {compact ? (
        <>
          <UploadCloud className="size-4 text-muted-foreground group-hover:text-primary" />
          <span className="text-sm font-medium">{isDragActive ? "Drop to add" : "Add more files"}</span>
        </>
      ) : (
        <>
          <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <UploadCloud className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium">
              {isDragActive ? "Drop your files here" : multiple ? "Drag & drop files here" : "Drag & drop a file here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or <span className="font-medium text-primary underline-offset-4 group-hover:underline">browse</span>
              {paste && " · you can also paste"}
              {maxSize ? ` · up to ${formatBytes(maxSize, 0)} each` : ""}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Processed in your browser. Files never leave your device.
          </p>
        </>
      )}
    </div>
  );
}
