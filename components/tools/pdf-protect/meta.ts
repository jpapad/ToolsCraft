import { FileLock2 } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const pdfProtectMeta: ToolMeta = {
  slug: "protect-pdf",
  name: "Protect / Unlock PDF",
  tagline: "Add a password to a PDF, or remove one you know.",
  category: "pdf",
  icon: FileLock2,
  status: "live",
  runtime: "client",
  accept: { "application/pdf": [".pdf"] },
  maxFiles: 20,
  maxSizeMB: 200,
  seo: {
    title: "Password Protect PDF or Remove PDF Password — AES-256",
    description:
      "Encrypt a PDF with a password using AES-256, optionally blocking printing and copying, or remove the password from a PDF you can open. Runs in your browser, so passwords and files stay with you.",
    keywords: ["password protect pdf", "encrypt pdf", "unlock pdf", "remove pdf password", "pdf password"],
    howTo: [
      "Choose Protect or Unlock, then drop your PDFs.",
      "Enter the password: a new one to protect, or the current one to unlock.",
      "Click the button and download the result.",
    ],
    faq: [
      {
        q: "How strong is the encryption?",
        a: "Protected files use 256-bit AES, the strongest standard PDF encryption. It works in Adobe Reader, browsers and all modern PDF apps.",
      },
      {
        q: "Can you unlock a PDF if I forgot the password?",
        a: "No. Unlocking needs the current password. This tool removes a password you know, so you don’t have to type it every time. It doesn’t crack passwords.",
      },
      {
        q: "Can it remove printing or copying restrictions?",
        a: "Yes. If a PDF opens without a password but won’t let you print or copy, choose Unlock and leave the password empty.",
      },
      {
        q: "Is my password sent anywhere?",
        a: "No. Encryption and decryption run in your browser using qpdf compiled to WebAssembly. The password and the file never leave your device.",
      },
    ],
  },
};
