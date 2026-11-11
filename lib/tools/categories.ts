import { Code2, FileText, Image as ImageIcon, type LucideIcon } from "lucide-react";
import type { ToolCategory } from "./types";

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon tile. Kept here so cards stay consistent. */
  tone: string;
}

export const categories: CategoryInfo[] = [
  {
    id: "pdf",
    name: "PDF Tools",
    description: "Merge, split, reorder and convert PDFs without uploading them anywhere.",
    icon: FileText,
    tone: "bg-cat-pdf/10 text-cat-pdf",
  },
  {
    id: "image",
    name: "Image Tools",
    description: "Compress, convert and resize images with WebAssembly codecs, right in your browser.",
    icon: ImageIcon,
    tone: "bg-cat-image/10 text-cat-image",
  },
  {
    id: "dev",
    name: "Developer Tools",
    description: "Everyday text and data utilities: JSON, Base64, QR codes and more.",
    icon: Code2,
    tone: "bg-cat-dev/10 text-cat-dev",
  },
];

export const getCategory = (id: string) => categories.find((c) => c.id === id);
