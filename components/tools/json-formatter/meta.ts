import { Braces } from "lucide-react";
import type { ToolMeta } from "@/lib/tools/types";

export const jsonFormatterMeta: ToolMeta = {
  slug: "json-formatter",
  name: "JSON Formatter",
  tagline: "Format, validate and minify JSON instantly.",
  category: "dev",
  icon: Braces,
  status: "live",
  runtime: "client",
  seo: {
    title: "JSON Formatter & Validator — Beautify or Minify JSON",
    description:
      "Paste JSON to pretty-print, validate or minify it instantly. Clear error messages for invalid JSON. Runs in your browser, nothing is sent to a server.",
    keywords: ["json formatter", "json beautifier", "json validator", "minify json", "pretty print json"],
    howTo: [
      "Paste or type your JSON into the Input box.",
      "Choose Format or Minify, and pick an indent size.",
      "Copy the result or download it as a .json file.",
    ],
    faq: [
      {
        q: "Is my JSON sent anywhere?",
        a: "No. Formatting and validation happen in your browser with the built-in JSON parser. Nothing is uploaded or logged.",
      },
      {
        q: "How do I find the error in invalid JSON?",
        a: "The tool shows the parser’s error message as you type, including the line and column when your browser reports them.",
      },
      {
        q: "What does “Sort keys” do?",
        a: "It orders the keys of every object alphabetically, at every level. This makes two JSON documents much easier to compare.",
      },
    ],
  },
};
