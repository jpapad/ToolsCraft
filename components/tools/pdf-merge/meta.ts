import { Combine } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const pdfMergeMeta: ToolMeta = {
  slug: "merge-pdf",
  name: "Merge PDF",
  tagline: "Combine multiple PDFs into one, in any order.",
  category: "pdf",
  icon: Combine,
  status: "live",
  runtime: "client",
  accept: { "application/pdf": [".pdf"] },
  maxFiles: 50,
  maxSizeMB: 200,
  seo: {
    title: "Merge PDF Files Online — Free & Private",
    description:
      "Combine multiple PDF files into one document in seconds. Drag to reorder pages. Runs entirely in your browser, so your files are never uploaded.",
    keywords: ["merge pdf", "combine pdf", "join pdf files", "pdf merger", "merge pdf offline"],
    howTo: [
      "Drop your PDF files into the box above, or click to choose them.",
      "Drag the handles to put the files in the order you want.",
      "Click “Merge PDFs” and download your combined document.",
    ],
    faq: [
      {
        q: "Are my PDFs uploaded to a server?",
        a: "No. The merge happens entirely inside your browser. Your files never leave your device, and the tool keeps working offline once the page has loaded.",
      },
      {
        q: "Is there a limit on file size or number of files?",
        a: "You can merge up to 50 files of up to 200 MB each. The real limit is your device’s memory, so very large batches work best on a desktop browser.",
      },
      {
        q: "Can I merge password-protected PDFs?",
        a: "Not yet. Remove the password first; an Unlock PDF tool is on the way.",
      },
      {
        q: "Will links, bookmarks and form fields be kept?",
        a: "Page content, text and images are preserved exactly. Document-level bookmarks (outlines) and some interactive form fields may not carry over to the merged file.",
      },
    ],
  },
};
