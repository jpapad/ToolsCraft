import { Images } from "lucide-react";
import { imageAccept } from "@/lib/engines/image/formats";
import type { ToolMeta } from "@/lib/tools/types";

export const imagesToPdfMeta: ToolMeta = {
  slug: "images-to-pdf",
  name: "Images to PDF",
  tagline: "Turn JPG, PNG and WebP images into one PDF.",
  category: "pdf",
  icon: Images,
  status: "live",
  runtime: "client",
  accept: imageAccept,
  maxFiles: 200,
  maxSizeMB: 50,
  seo: {
    title: "Images to PDF — Convert JPG, PNG & WebP to PDF",
    description:
      "Combine photos and scans into a single PDF. Reorder pages, pick A4, Letter or original size, and add margins. Works offline: your images never leave your device.",
    keywords: ["jpg to pdf", "images to pdf", "png to pdf", "photo to pdf", "convert images to pdf"],
    howTo: [
      "Drop your images. Each one becomes a page.",
      "Drag to reorder, then choose page size, orientation and margins.",
      "Click “Create PDF” and download it.",
    ],
    faq: [
      {
        q: "Will my photos lose quality?",
        a: "JPG and PNG images are placed in the PDF exactly as they are, with no re-compression. Other formats, and phone photos that need rotating, are converted at high quality.",
      },
      {
        q: "Are phone photos rotated correctly?",
        a: "Yes. The rotation stored in the photo’s metadata is applied, so pictures appear the right way up.",
      },
      {
        q: "Are my images uploaded?",
        a: "No. The PDF is created in your browser, and nothing is sent to a server.",
      },
    ],
  },
};
