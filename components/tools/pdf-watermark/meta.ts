import { Stamp } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const pdfWatermarkMeta: ToolMeta = {
  slug: "watermark-pdf",
  name: "Watermark PDF",
  tagline: "Stamp text or a logo on every page.",
  category: "pdf",
  icon: Stamp,
  status: "live",
  runtime: "client",
  accept: { "application/pdf": [".pdf"] },
  maxFiles: 20,
  maxSizeMB: 200,
  seo: {
    title: "Add Watermark to PDF — Text or Logo, Free & Private",
    description:
      "Stamp “CONFIDENTIAL”, “DRAFT”, your name or your logo on every page of a PDF. Choose size, angle, opacity and a centered or tiled layout. Your files never leave your browser.",
    keywords: ["watermark pdf", "add watermark to pdf", "pdf stamp", "confidential watermark", "logo watermark pdf"],
    howTo: [
      "Drop one or more PDFs.",
      "Type your watermark text or choose a logo image, then set color, size, angle and opacity.",
      "Click “Add watermark” and download the stamped PDFs.",
    ],
    faq: [
      {
        q: "Can I use Greek, Cyrillic or emoji in the watermark?",
        a: "Yes. Text watermarks are drawn with your device’s fonts, so any language and emoji work.",
      },
      {
        q: "Can the watermark be removed?",
        a: "It’s added as a separate layer on top of the page content. That stops casual copying, but someone with PDF editing software could remove it.",
      },
      {
        q: "Are my PDFs uploaded?",
        a: "No. The watermark is applied in your browser.",
      },
    ],
  },
};
