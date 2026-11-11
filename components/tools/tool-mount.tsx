"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { ToolSkeleton } from "@/components/shared/tool-skeleton";

/**
 * Slug → lazily loaded tool UI. Each tool's code (and its heavy libraries)
 * is only downloaded on that tool's page, and never runs on the server.
 * Next requires the options to be an inline object literal in every call.
 */
const loaders: Record<string, ComponentType> = {
  "merge-pdf": dynamic(() => import("./pdf-merge/tool"), { ssr: false, loading: ToolSkeleton }),
  "split-pdf": dynamic(() => import("./pdf-split/tool"), { ssr: false, loading: ToolSkeleton }),
  "images-to-pdf": dynamic(() => import("./images-to-pdf/tool"), { ssr: false, loading: ToolSkeleton }),
  "pdf-to-images": dynamic(() => import("./pdf-to-images/tool"), { ssr: false, loading: ToolSkeleton }),
  "organize-pdf": dynamic(() => import("./pdf-organize/tool"), { ssr: false, loading: ToolSkeleton }),
  "watermark-pdf": dynamic(() => import("./pdf-watermark/tool"), { ssr: false, loading: ToolSkeleton }),
  "protect-pdf": dynamic(() => import("./pdf-protect/tool"), { ssr: false, loading: ToolSkeleton }),
  "resize-image": dynamic(() => import("./image-resize/tool"), { ssr: false, loading: ToolSkeleton }),
  "compress-pdf": dynamic(() => import("./pdf-compress/tool"), { ssr: false, loading: ToolSkeleton }),
  "remove-background": dynamic(() => import("./remove-background/tool"), { ssr: false, loading: ToolSkeleton }),
  "compress-image": dynamic(() => import("./image-compress/tool"), { ssr: false, loading: ToolSkeleton }),
  "convert-image": dynamic(() => import("./image-convert/tool"), { ssr: false, loading: ToolSkeleton }),
  "json-formatter": dynamic(() => import("./json-formatter/tool"), { ssr: false, loading: ToolSkeleton }),
  base64: dynamic(() => import("./base64/tool"), { ssr: false, loading: ToolSkeleton }),
  "qr-code-generator": dynamic(() => import("./qr-code/tool"), { ssr: false, loading: ToolSkeleton }),
  "text-case-converter": dynamic(() => import("./text-case/tool"), { ssr: false, loading: ToolSkeleton }),
};

export function ToolMount({ slug }: { slug: string }) {
  const Tool = loaders[slug];
  return Tool ? <Tool /> : null;
}
