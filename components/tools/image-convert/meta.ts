import { RefreshCw } from "lucide-react";
import { imageAccept } from "@/lib/engines/image/formats";
import type { ToolMeta } from "@/lib/tools/types";

export const imageConvertMeta: ToolMeta = {
  slug: "convert-image",
  name: "Image Converter",
  tagline: "Convert between WebP, PNG, JPG and AVIF.",
  category: "image",
  icon: RefreshCw,
  status: "live",
  runtime: "client",
  accept: imageAccept,
  maxFiles: 100,
  maxSizeMB: 50,
  seo: {
    title: "Image Converter — Convert to WebP, PNG, JPG or AVIF",
    description:
      "Convert images between JPG, PNG, WebP and AVIF in bulk. Also accepts GIF and BMP. Fast, free, and private: conversion happens in your browser.",
    keywords: ["image converter", "webp to jpg", "png to webp", "jpg to png", "convert to avif"],
    howTo: [
      "Drop the images you want to convert.",
      "Choose the target format and, for JPG, WebP or AVIF, a quality level.",
      "Click “Convert” and download the files, or all of them as a ZIP.",
    ],
    faq: [
      {
        q: "Are my images uploaded?",
        a: "No. Your browser decodes the images and WebAssembly encoders convert them on your device.",
      },
      {
        q: "What happens to transparency when converting to JPG?",
        a: "JPG has no transparency, so transparent areas become white. Choose PNG, WebP or AVIF to keep transparency.",
      },
      {
        q: "Can I convert animated GIFs?",
        a: "Only the first frame is converted. Animated output isn’t supported yet.",
      },
    ],
  },
};
