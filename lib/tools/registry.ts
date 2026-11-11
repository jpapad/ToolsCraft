import { base64Meta } from "@/components/tools/base64/meta";
import { imageCompressMeta } from "@/components/tools/image-compress/meta";
import { imageConvertMeta } from "@/components/tools/image-convert/meta";
import { imageResizeMeta } from "@/components/tools/image-resize/meta";
import { imagesToPdfMeta } from "@/components/tools/images-to-pdf/meta";
import { jsonFormatterMeta } from "@/components/tools/json-formatter/meta";
import { pdfCompressMeta } from "@/components/tools/pdf-compress/meta";
import { pdfMergeMeta } from "@/components/tools/pdf-merge/meta";
import { pdfOrganizeMeta } from "@/components/tools/pdf-organize/meta";
import { pdfProtectMeta } from "@/components/tools/pdf-protect/meta";
import { pdfSplitMeta } from "@/components/tools/pdf-split/meta";
import { pdfToImagesMeta } from "@/components/tools/pdf-to-images/meta";
import { pdfWatermarkMeta } from "@/components/tools/pdf-watermark/meta";
import { qrCodeMeta } from "@/components/tools/qr-code/meta";
import { removeBackgroundMeta } from "@/components/tools/remove-background/meta";
import { textCaseMeta } from "@/components/tools/text-case/meta";
import type { ToolCategory, ToolMeta, ToolSummary } from "./types";

/**
 * Tools with a working page. To add a tool:
 * 1. create components/tools/<slug>/{meta.ts,tool.tsx,...}
 * 2. add its meta here
 * 3. add its loader in components/tools/tool-mount.tsx
 */
export const tools: ToolMeta[] = [
  pdfMergeMeta,
  pdfSplitMeta,
  imagesToPdfMeta,
  pdfToImagesMeta,
  pdfOrganizeMeta,
  pdfWatermarkMeta,
  pdfProtectMeta,
  pdfCompressMeta,
  imageCompressMeta,
  imageConvertMeta,
  imageResizeMeta,
  removeBackgroundMeta,
  jsonFormatterMeta,
  base64Meta,
  qrCodeMeta,
  textCaseMeta,
];

/** Shown as "Coming soon" cards. Move into `tools` once built. */
export const plannedTools: ToolSummary[] = [];

export const getTool = (slug: string) => tools.find((t) => t.slug === slug);

export const toolsInCategory = (category: ToolCategory) => ({
  live: tools.filter((t) => t.category === category),
  planned: plannedTools.filter((t) => t.category === category),
});
