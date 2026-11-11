import type { LucideIcon } from "lucide-react";
import type { Accept } from "react-dropzone";

export type ToolCategory = "pdf" | "image" | "dev";

/** Minimal info for a tool card. Planned tools only have this. */
export interface ToolSummary {
  slug: string;
  name: string;
  /** One short sentence shown on cards. */
  tagline: string;
  category: ToolCategory;
  icon: LucideIcon;
}

/** Full metadata for a tool that has a page. Server-safe: no heavy imports. */
export interface ToolMeta extends ToolSummary {
  status: "live" | "beta";
  /** "client" = runs fully in the browser; "server" = uploads to our worker. */
  runtime: "client" | "server";
  accept?: Accept;
  maxFiles?: number;
  maxSizeMB?: number;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    howTo: string[];
    faq: { q: string; a: string }[];
  };
}

export interface ProcessedFile {
  name: string;
  blob: Blob;
}

export interface ProcessContext {
  signal: AbortSignal;
  onProgress: (pct: number) => void;
}

/**
 * The only thing a file tool must implement.
 * - "each":    one input → one or more outputs (compress, convert, split)
 * - "combine": all inputs → one or more outputs (merge, images-to-pdf)
 */
export type Processor<O> =
  | {
      mode: "each";
      run: (file: File, opts: O, ctx: ProcessContext) => Promise<ProcessedFile[]>;
    }
  | {
      mode: "combine";
      run: (files: File[], opts: O, ctx: ProcessContext) => Promise<ProcessedFile[]>;
    };
