export const site = {
  name: "ToolsCraft",
  tagline: "Private file & developer tools that run in your browser",
  description:
    "Free PDF, image and developer tools that run entirely in your browser. Merge PDFs, compress images, format JSON and more. Your files are never uploaded.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};
