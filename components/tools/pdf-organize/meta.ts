import { LayoutGrid } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const pdfOrganizeMeta: ToolMeta = {
  slug: "organize-pdf",
  name: "Organize PDF",
  tagline: "Reorder, rotate and delete pages visually.",
  category: "pdf",
  icon: LayoutGrid,
  status: "live",
  runtime: "client",
  accept: { "application/pdf": [".pdf"] },
  maxFiles: 1,
  maxSizeMB: 200,
  seo: {
    title: "Organize PDF Pages — Reorder, Rotate & Delete",
    description:
      "See every page of your PDF as a thumbnail. Drag pages into a new order, rotate them, or delete the ones you don’t need, then save. Works entirely in your browser.",
    keywords: ["organize pdf", "reorder pdf pages", "rotate pdf pages", "delete pdf pages", "rearrange pdf"],
    howTo: [
      "Drop a PDF. Every page appears as a thumbnail.",
      "Drag pages to reorder them, and use the buttons on each page to rotate or delete it.",
      "Click “Save PDF” to download the reorganized document.",
    ],
    faq: [
      {
        q: "Does rotating or reordering reduce quality?",
        a: "No. Pages are copied exactly as they are; only their order and rotation change.",
      },
      {
        q: "Can I use the keyboard?",
        a: "Yes. Focus a page’s drag handle, press Space to pick it up, move it with the arrow keys, and press Space again to drop it.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Thumbnails are rendered and the new PDF is built in your browser.",
      },
    ],
  },
};
