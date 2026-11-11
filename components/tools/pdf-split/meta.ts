import { Scissors } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const pdfSplitMeta: ToolMeta = {
  slug: "split-pdf",
  name: "Split PDF",
  tagline: "Extract pages or split into multiple files.",
  category: "pdf",
  icon: Scissors,
  status: "live",
  runtime: "client",
  accept: { "application/pdf": [".pdf"] },
  maxFiles: 20,
  maxSizeMB: 200,
  seo: {
    title: "Split PDF Online — Extract Pages or Split by Range",
    description:
      "Split a PDF into single pages or custom ranges, or extract just the pages you need into a new file. Free and private: your PDF never leaves your browser.",
    keywords: ["split pdf", "extract pdf pages", "separate pdf pages", "pdf splitter", "split pdf by range"],
    howTo: [
      "Drop a PDF (or several) into the box above.",
      "Choose how to split: every page, custom ranges, or extract selected pages into one file.",
      "Click “Split PDF” and download the files, or all of them as a ZIP.",
    ],
    faq: [
      {
        q: "How do I write page ranges?",
        a: "Separate ranges with commas: “1-3, 5, 8-” gives pages 1 to 3, page 5, and page 8 to the end. With “Custom ranges” each range becomes its own file. With “Extract pages” they all go into one file.",
      },
      {
        q: "Is my PDF uploaded?",
        a: "No. Splitting happens in your browser. The file never leaves your device.",
      },
      {
        q: "Does splitting reduce quality?",
        a: "No. Pages are copied exactly as they are, so text stays selectable and images keep their original quality.",
      },
    ],
  },
};
