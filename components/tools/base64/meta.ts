import { Binary } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const base64Meta: ToolMeta = {
  slug: "base64",
  name: "Base64 Encode / Decode",
  tagline: "Encode text or files to Base64 and back.",
  category: "dev",
  icon: Binary,
  status: "live",
  runtime: "client",
  seo: {
    title: "Base64 Encode & Decode — Text, Files and Data URIs",
    description:
      "Encode text or any file to Base64, or decode Base64 back to text or a downloadable file. Supports UTF-8, URL-safe Base64 and data URIs. Runs locally in your browser.",
    keywords: ["base64 encode", "base64 decode", "base64 to image", "image to base64", "data uri generator"],
    howTo: [
      "Choose Text or File.",
      "For text, pick Encode or Decode and type or paste your input. The result updates as you type.",
      "For files, drop a file to get its Base64 string or a ready-to-use data URI.",
    ],
    faq: [
      {
        q: "Does it handle emoji and non-English text?",
        a: "Yes. Text is encoded as UTF-8, so any language and emoji round-trip correctly.",
      },
      {
        q: "What is URL-safe Base64?",
        a: "A variant that uses - and _ instead of + and / and drops the = padding, so the result can go in URLs and file names. The decoder accepts both variants automatically.",
      },
      {
        q: "What if the Base64 is an image or a file?",
        a: "If the decoded data isn’t text, the tool offers it as a file download and detects common types like PNG, JPG, GIF, WebP, PDF and ZIP.",
      },
    ],
  },
};
