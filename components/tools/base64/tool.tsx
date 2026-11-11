"use client";

import { useState } from "react";
import { Check, Copy, Download, FileIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileDropzone } from "@/components/shared/file-dropzone";
import { TextToolShell, type TextResult } from "@/components/shared/text-tool-shell";
import { downloadBlob } from "@/lib/utils/download";
import { formatBytes } from "@/lib/utils/files";
import { BinaryDataError, bytesToBase64, decodeText, encodeText, sniffMime } from "./base64";

type Direction = "encode" | "decode";

function TextMode() {
  const [input, setInput] = useState("");
  const [direction, setDirection] = useState<Direction>("encode");
  const [urlSafe, setUrlSafe] = useState(false);

  let result: TextResult;
  let binary: BinaryDataError | null = null;
  try {
    result = { ok: true, value: !input ? "" : direction === "encode" ? encodeText(input, urlSafe) : decodeText(input) };
  } catch (e) {
    if (e instanceof BinaryDataError) binary = e;
    result = { ok: false, error: e instanceof Error ? e.message : "Invalid input" };
  }

  const downloadBinary = () => {
    if (!binary) return;
    const { mime, ext } = binary.mime ? { mime: binary.mime, ext: binary.mime.split("/")[1]?.split("+")[0] || "bin" } : sniffMime(binary.bytes);
    downloadBlob(new Blob([binary.bytes as BlobPart], { type: mime }), `decoded.${ext}`);
  };

  return (
    <TextToolShell
      input={input}
      onInputChange={setInput}
      result={result}
      inputLabel={direction === "encode" ? "Text" : "Base64"}
      outputLabel={direction === "encode" ? "Base64" : "Text"}
      placeholder={direction === "encode" ? "Type or paste text to encode…" : "Paste Base64 or a data: URI to decode…"}
      downloadName={direction === "encode" ? "encoded.txt" : "decoded.txt"}
      toolbar={
        <>
          <Tabs value={direction} onValueChange={(v) => setDirection(v as Direction)}>
            <TabsList>
              <TabsTrigger value="encode">Encode</TabsTrigger>
              <TabsTrigger value="decode">Decode</TabsTrigger>
            </TabsList>
          </Tabs>
          {direction === "encode" && (
            <div className="flex items-center gap-2">
              <Switch id="url-safe" checked={urlSafe} onCheckedChange={setUrlSafe} />
              <Label htmlFor="url-safe">URL-safe</Label>
            </div>
          )}
          {binary && (
            <Button size="sm" className="ml-auto" onClick={downloadBinary}>
              <Download /> Download decoded file ({formatBytes(binary.bytes.length)})
            </Button>
          )}
        </>
      }
    />
  );
}

function FileMode() {
  const [file, setFile] = useState<{ name: string; size: number; type: string; b64: string } | null>(null);
  const [asDataUri, setAsDataUri] = useState(true);
  const [copied, setCopied] = useState(false);

  const onFiles = async ([f]: File[]) => {
    if (!f) return;
    const b64 = bytesToBase64(new Uint8Array(await f.arrayBuffer()));
    setFile({ name: f.name, size: f.size, type: f.type || "application/octet-stream", b64 });
  };

  const output = file ? (asDataUri ? `data:${file.type};base64,${file.b64}` : file.b64) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed. Your browser blocked clipboard access.");
    }
  };

  if (!file) {
    return <FileDropzone onFiles={onFiles} multiple={false} maxSize={20 * 1024 * 1024} hint="Any file type, up to 20 MB" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
        <FileIcon className="size-5 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.size)} → {formatBytes(output.length)} of text
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="data-uri" checked={asDataUri} onCheckedChange={setAsDataUri} />
          <Label htmlFor="data-uri">Data URI</Label>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Choose another file" onClick={() => setFile(null)}>
          <X />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex h-8 items-center justify-between">
          <Label htmlFor="file-b64">Base64</Label>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => downloadBlob(new Blob([output]), `${file.name}.base64.txt`)}>
              <Download /> Download
            </Button>
            <Button variant="ghost" size="sm" onClick={copy}>
              {copied ? <Check /> : <Copy />} {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <Textarea id="file-b64" value={output} readOnly className="min-h-80 break-all font-mono text-xs" />
      </div>
    </div>
  );
}

export default function Base64Tool() {
  const [mode, setMode] = useState<"text" | "file">("text");
  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "file")}>
        <TabsList>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="file">File</TabsTrigger>
        </TabsList>
      </Tabs>
      {mode === "text" ? <TextMode /> : <FileMode />}
    </div>
  );
}
