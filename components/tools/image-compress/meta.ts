import { Minimize2 } from "lucide-react";
import { imageAccept } from "@/lib/engines/image/formats";
import type { ToolMeta } from "@/lib/tools/types";

export const imageCompressMeta: ToolMeta = {
  slug: "compress-image",
  name: "Image Compressor",
  tagline: "Smaller images with a live before/after.",
  category: "image",
  icon: Minimize2,
  status: "live",
  runtime: "client",
  accept: imageAccept,
  maxFiles: 100,
  maxSizeMB: 50,
  seo: {
    title: "Compress Images Online — JPG, PNG, WebP & AVIF",
    description:
      "Reduce image file size by up to 80% with MozJPEG, WebP and AVIF encoders. Compare before and after, then download one by one or as a ZIP. Images never leave your device.",
    keywords: ["compress image", "image compressor", "reduce image size", "compress jpg", "compress png", "webp compressor"],
    howTo: [
      "Drop one or more images (JPG, PNG, WebP, AVIF, GIF or BMP).",
      "Pick a quality level. Optionally convert to WebP or AVIF, or shrink large photos.",
      "Click “Compress”, compare the result with the slider, and download.",
    ],
    faq: [
      {
        q: "Are my images uploaded?",
        a: "No. Compression runs in your browser with WebAssembly versions of MozJPEG, libwebp, libavif and OxiPNG. Nothing is sent to a server.",
      },
      {
        q: "Which format gives the smallest files?",
        a: "AVIF is usually the smallest, then WebP, then JPG. Both WebP and AVIF work in all modern browsers. Choose JPG if you need maximum compatibility with older software.",
      },
      {
        q: "Why didn’t my PNG get much smaller?",
        a: "PNG is lossless, so it can only be optimized, not compressed with quality loss. For big savings, convert it to WebP, which keeps transparency.",
      },
      {
        q: "What happens to photo metadata?",
        a: "Location, camera details and other metadata are removed, and the photo’s rotation is applied to the pixels, so the image still displays the right way up.",
      },
    ],
  },
};
