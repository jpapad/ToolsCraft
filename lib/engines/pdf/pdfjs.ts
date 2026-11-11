"use client";

/**
 * Lazy pdf.js loader for rendering PDF pages to canvas (browser only).
 * Parsing runs in pdf.js's own worker; drawing happens on a canvas here.
 */
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

let lib: Promise<typeof import("pdfjs-dist")> | undefined;

function getPdfjs() {
  lib ??= import("pdfjs-dist").then((pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerPort = new Worker(new URL("./pdfjs.worker.ts", import.meta.url), {
      type: "module",
    });
    return pdfjs;
  });
  return lib;
}

const VENDOR = "/vendor/pdfjs/";

export class PdfPasswordError extends Error {
  constructor() {
    super("This PDF is password-protected. Unlock it first with the Unlock PDF tool.");
  }
}

export interface OpenedPdf {
  doc: PDFDocumentProxy;
  /** Frees the document's memory in the pdf.js worker. */
  close: () => Promise<void>;
}

export async function openPdf(data: ArrayBuffer | Uint8Array): Promise<OpenedPdf> {
  const pdfjs = await getPdfjs();
  const task = pdfjs.getDocument({
    // pdf.js takes ownership of (detaches) the buffer, so give it a copy.
    data: new Uint8Array(data).slice(),
    standardFontDataUrl: `${VENDOR}standard_fonts/`,
    cMapUrl: `${VENDOR}cmaps/`,
    wasmUrl: `${VENDOR}wasm/`,
    iccUrl: `${VENDOR}iccs/`,
  });
  try {
    return { doc: await task.promise, close: () => task.destroy() };
  } catch (e) {
    void task.destroy();
    if ((e as { name?: string })?.name === "PasswordException") throw new PdfPasswordError();
    throw new Error("This file isn’t a valid PDF or is damaged.");
  }
}

/** Renders a page so its longest side is about `targetPx`, or at `scale` if given. */
export async function renderPage(
  page: PDFPageProxy,
  { scale, targetPx, background = "#ffffff" }: { scale?: number; targetPx?: number; background?: string },
): Promise<HTMLCanvasElement> {
  const base = page.getViewport({ scale: 1 });
  const s = scale ?? (targetPx ? targetPx / Math.max(base.width, base.height) : 1);
  const viewport = page.getViewport({ scale: s });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  await page.render({ canvas, viewport, background }).promise;
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not export the page image."))), type, quality),
  );
}
