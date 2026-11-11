import { CaseSensitive } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const textCaseMeta: ToolMeta = {
  slug: "text-case-converter",
  name: "Text Case Converter",
  tagline: "camelCase, snake_case, Title Case and more.",
  category: "dev",
  icon: CaseSensitive,
  status: "live",
  runtime: "client",
  seo: {
    title: "Text Case Converter — camelCase, snake_case, Title Case & More",
    description:
      "Convert text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase, PascalCase, snake_case, kebab-case and more, all at once. Copy any result with one click.",
    keywords: ["case converter", "camelcase converter", "snake case converter", "title case converter", "uppercase to lowercase"],
    howTo: [
      "Type or paste your text into the box.",
      "Every case is shown at once and updates as you type.",
      "Click “Copy” on the one you need.",
    ],
    faq: [
      {
        q: "Does it work line by line?",
        a: "Yes. Code-style cases (camelCase, snake_case, etc.) convert each line separately, so you can convert a whole list of names at once.",
      },
      {
        q: "Does it support accented and non-Latin letters?",
        a: "Yes. Upper, lower, Title and Sentence case work with any alphabet, including Greek and Cyrillic.",
      },
      {
        q: "Is my text stored anywhere?",
        a: "No. Everything happens in your browser, and nothing is sent or saved.",
      },
    ],
  },
};
