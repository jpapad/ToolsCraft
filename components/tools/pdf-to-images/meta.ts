import { FileImage } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const pdfToImagesMeta: ToolMeta = {
  slug: "pdf-to-images",
  name: "PDF to Images",
  tagline: "Export every page as a PNG or JPG.",
  category: "pdf",
  icon: FileImage,
  status: "live",
  runtime: "client",
  accept: { "application/pdf": [".pdf"] },
  maxFiles: 20,
  maxSizeMB: 200,
  seo: {
    title: "PDF to JPG / PNG — Convert PDF Pages to Images",
    description:
      "Turn PDF pages into high-quality PNG or JPG images at up to 300 DPI. Convert all pages or just the ones you choose, and download them as a ZIP. Nothing is uploaded.",
    keywords: ["pdf to jpg", "pdf to png", "pdf to image", "convert pdf to images", "extract pdf pages as images"],
    howTo: [
      "Drop one or more PDF files.",
      "Choose PNG or JPG, the resolution (DPI), and optionally which pages.",
      "Click “Convert to images” and download them, or all of them as a ZIP.",
    ],
    faq: [
      {
        q: "Which resolution should I pick?",
        a: "150 DPI is good for screens and sharing. Choose 300 DPI for printing or when you need to zoom into small text. 72 DPI gives the smallest files.",
      },
      {
        q: "PNG or JPG?",
        a: "PNG keeps text and line art perfectly sharp. JPG makes much smaller files for pages that are mostly photos.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Pages are rendered in your browser with Mozilla’s pdf.js. The file never leaves your device.",
      },
    ],
  },
};
