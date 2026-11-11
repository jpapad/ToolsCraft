import { Shrink } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const pdfCompressMeta: ToolMeta = {
  slug: "compress-pdf",
  name: "Compress PDF",
  tagline: "Shrink scanned and image-heavy PDFs.",
  category: "pdf",
  icon: Shrink,
  status: "live",
  runtime: "client",
  accept: { "application/pdf": [".pdf"] },
  maxFiles: 20,
  maxSizeMB: 300,
  seo: {
    title: "Compress PDF — Reduce PDF File Size Without Uploading",
    description:
      "Make scanned documents and photo-heavy PDFs much smaller by re-compressing their images with MozJPEG. Text stays sharp and selectable. Runs entirely in your browser.",
    keywords: ["compress pdf", "reduce pdf size", "shrink pdf", "pdf compressor", "make pdf smaller"],
    howTo: [
      "Drop one or more PDFs.",
      "Choose a compression level. “Recommended” works well for most documents.",
      "Click “Compress PDF”, check how much smaller each file got, and download.",
    ],
    faq: [
      {
        q: "Which PDFs shrink the most?",
        a: "Scans and documents full of photos, often by 50–90%. PDFs that are mostly text are already compact and may barely change.",
      },
      {
        q: "Will text become blurry?",
        a: "No. Only images are re-compressed. Text and vector graphics are left exactly as they are, so they stay sharp and searchable.",
      },
      {
        q: "What do the levels do?",
        a: "Light keeps images close to the original. Recommended scales very large images to a sensible size and compresses them more. Strong gives the smallest file, for email or upload limits.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Compression happens in your browser, unlike most online compressors.",
      },
    ],
  },
};
