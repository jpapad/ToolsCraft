import { Crop } from "lucide-react";
import { imageAccept } from "@/lib/engines/image/formats";
import type { ToolMeta } from "@/lib/tools/types";

export const imageResizeMeta: ToolMeta = {
  slug: "resize-image",
  name: "Resize & Crop",
  tagline: "Resize images in bulk or crop to any aspect ratio.",
  category: "image",
  icon: Crop,
  status: "live",
  runtime: "client",
  accept: imageAccept,
  maxFiles: 100,
  maxSizeMB: 50,
  seo: {
    title: "Resize & Crop Images Online — By Pixels, Percent or Aspect Ratio",
    description:
      "Resize many images at once by exact pixels or percentage, or crop a photo to 1:1, 4:3, 16:9 and more. High-quality resampling, any format, no uploads.",
    keywords: ["resize image", "crop image", "image resizer", "resize photo", "crop to square", "bulk image resize"],
    howTo: [
      "Choose Resize (many images) or Crop (one image).",
      "To resize, set a percentage or a width and/or height. To crop, pick an aspect ratio and drag the frame.",
      "Download the result in its original format, or convert to JPG, PNG, WebP or AVIF.",
    ],
    faq: [
      {
        q: "Will resizing distort my images?",
        a: "Not with “Keep aspect ratio” on: the image is scaled to fit inside the width and height you enter. Turn it off to stretch to exact dimensions.",
      },
      {
        q: "Can I make images bigger?",
        a: "Yes. Enlarging uses high-quality resampling, but it can’t add detail that wasn’t in the original.",
      },
      {
        q: "Are my images uploaded?",
        a: "No. All resizing and cropping happens in your browser.",
      },
    ],
  },
};
