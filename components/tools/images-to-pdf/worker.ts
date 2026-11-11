import { expose, transfer } from "comlink";
import { PDFDocument, type PDFImage } from "pdf-lib";
import { decodeImage, hasTransparency } from "@/lib/engines/image/codec";
import { jpegOrientation, placeImage, sniffImageType, type LayoutOptions } from "./layout";

async function canvasEncode(image: ImageData, type: "image/png" | "image/jpeg") {
  const canvas = new OffscreenCanvas(image.width, image.height);
  canvas.getContext("2d")!.putImageData(image, 0, 0);
  const blob = await canvas.convertToBlob({ type, quality: 0.92 });
  return new Uint8Array(await blob.arrayBuffer());
}

async function embed(doc: PDFDocument, file: Blob): Promise<PDFImage> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);

  // JPG and PNG can be embedded as-is (no quality loss, small output)…
  if (type === "jpeg" && jpegOrientation(bytes) === 1) return doc.embedJpg(bytes);
  if (type === "png") return doc.embedPng(bytes);

  // …everything else (WebP, AVIF, GIF, rotated phone photos) is re-encoded first.
  const { image } = await decodeImage(file);
  return hasTransparency(image)
    ? doc.embedPng(await canvasEncode(image, "image/png"))
    : doc.embedJpg(await canvasEncode(image, "image/jpeg"));
}

const api = {
  async build(files: { name: string; blob: Blob }[], opts: LayoutOptions, onProgress: (pct: number) => void) {
    const doc = await PDFDocument.create();
    for (const [i, f] of files.entries()) {
      let img: PDFImage;
      try {
        img = await embed(doc, f.blob);
      } catch {
        throw new Error(`“${f.name}” couldn’t be read as an image.`);
      }
      const p = placeImage(img.width, img.height, opts);
      doc.addPage([p.pageWidth, p.pageHeight]).drawImage(img, { x: p.x, y: p.y, width: p.width, height: p.height });
      onProgress(Math.round(((i + 1) / files.length) * 90));
    }
    doc.setProducer("ToolsCraft");
    const bytes = await doc.save();
    onProgress(100);
    return transfer(bytes, [bytes.buffer as ArrayBuffer]);
  },
};

export type ImagesToPdfWorker = typeof api;
expose(api);
