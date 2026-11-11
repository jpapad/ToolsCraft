import { QrCode } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const qrCodeMeta: ToolMeta = {
  slug: "qr-code-generator",
  name: "QR Code Generator",
  tagline: "Create QR codes for links, text or Wi-Fi, as PNG or SVG.",
  category: "dev",
  icon: QrCode,
  status: "live",
  runtime: "client",
  seo: {
    title: "Free QR Code Generator — PNG & SVG, No Sign-up",
    description:
      "Make QR codes for URLs, text or Wi-Fi networks. Choose colors and size, and download as high-resolution PNG or scalable SVG. The codes never expire and there's no tracking.",
    keywords: ["qr code generator", "free qr code", "wifi qr code", "qr code svg", "create qr code"],
    howTo: [
      "Choose Link / Text or Wi-Fi and enter the details.",
      "Adjust colors, size and error correction if you like. The preview updates live.",
      "Download the QR code as PNG or SVG.",
    ],
    faq: [
      {
        q: "Do these QR codes expire?",
        a: "No. The content is stored directly in the code. There’s no redirect service in between, so it works forever and nobody tracks the scans.",
      },
      {
        q: "PNG or SVG?",
        a: "SVG scales to any size without blurring, which makes it best for print. PNG works everywhere, including documents and chat apps.",
      },
      {
        q: "What is error correction?",
        a: "Higher levels let the code still scan when part of it is dirty or covered, but make it denser. “Medium” suits most uses. Choose “High” for print that might get damaged.",
      },
      {
        q: "Why won’t my code scan?",
        a: "Keep strong contrast (dark code on a light background) and leave a margin around it. Light-on-dark codes don’t work with every scanner.",
      },
    ],
  },
};
