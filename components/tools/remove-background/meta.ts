import { Eraser } from "lucide-react";
import { imageAccept } from "@/lib/engines/image/formats";
import type { ToolMeta } from "@/lib/tools/types";

export const removeBackgroundMeta: ToolMeta = {
  slug: "remove-background",
  name: "Background Remover",
  tagline: "Remove image backgrounds with on-device AI.",
  category: "image",
  icon: Eraser,
  status: "beta",
  runtime: "client",
  accept: imageAccept,
  maxFiles: 30,
  maxSizeMB: 30,
  seo: {
    title: "Remove Background from Image — Free, Private, On-Device AI",
    description:
      "Cut out people, products and pets from photos automatically. The AI model runs on your own device, so your photos are never uploaded. Download a transparent PNG or pick a background color.",
    keywords: ["remove background", "background remover", "transparent background", "remove bg", "cut out image"],
    howTo: [
      "Drop one or more photos.",
      "Choose a transparent background or a solid color.",
      "Click “Remove background”, compare with the slider, and download PNGs.",
    ],
    faq: [
      {
        q: "Are my photos uploaded?",
        a: "No. The AI model is downloaded to your browser once and runs on your device. Your photos never leave it.",
      },
      {
        q: "Why is the first run slow?",
        a: "The first time, your browser downloads the AI model (45–115 MB, depending on your device) and keeps it for next time. After that, each photo usually takes a few seconds with GPU acceleration (WebGPU in recent Chrome, Edge and Safari), or longer on the CPU.",
      },
      {
        q: "What works best?",
        a: "Photos with a clear subject: people, products, animals or objects. Fine details like hair are handled well, but very busy scenes may need a touch-up.",
      },
    ],
  },
};
