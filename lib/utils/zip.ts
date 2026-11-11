import type { ProcessedFile } from "@/lib/tools/types";
import { downloadBlob } from "./download";
import { uniqueName } from "./files";

export async function downloadZip(files: ProcessedFile[], zipName: string) {
  const { default: JSZip } = await import("jszip"); // only loaded when needed
  const zip = new JSZip();
  const used = new Set<string>();
  for (const f of files) zip.file(uniqueName(f.name, used), f.blob);
  // STORE: PDFs and images are already compressed; deflating again only costs CPU.
  const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
  downloadBlob(blob, zipName);
}
