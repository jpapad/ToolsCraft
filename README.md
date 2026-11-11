# ToolsCraft

Privacy-first PDF, image and developer tools. Everything runs in the browser; files are never uploaded.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run build && npm start` | Production build + server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Browser tests (Playwright), incl. the "no uploads" check |
| `RUN_AI_TESTS=1 npm run test:e2e` | Also runs the background-remover test (downloads the AI model) on CPU and WebGPU |
| `npm run typecheck` / `npm run lint` | Types / lint |

Set `NEXT_PUBLIC_SITE_URL` in production (used for sitemap, canonical URLs, JSON-LD).

## Adding a tool

1. Create `components/tools/<name>/` with:
   - `meta.ts` – name, icon, accepted files, SEO copy (server-safe, no heavy imports)
   - `tool.tsx` – the UI (`ToolShell` for file tools, `TextToolShell` for text tools)
   - `processor.ts` (+ `worker.ts`) – the processing logic, ideally in a Web Worker
2. Add the meta to `tools` in `lib/tools/registry.ts` (remove it from `plannedTools`).
3. Add a loader line in `components/tools/tool-mount.tsx`.

The page, sitemap entry, search entry, category listing and JSON-LD are generated automatically.

## Layout

- `app/` – routes (`/tools/[slug]`, `/category/[category]`, sitemap, robots)
- `components/shared/` – dropzone, file queue, tool shells, result panel
- `components/tools/` – one folder per tool
- `lib/hooks/use-file-processor.ts` – shared state machine (idle → ready → processing → done/error)
- `lib/workers/with-worker.ts` – runs a job in a Web Worker, terminates it on cancel
- `tests/unit`, `tests/e2e`

## Things worth knowing

- **WASM and font assets** (qpdf, pdf.js fonts/cmaps) are copied from `node_modules` into `public/vendor/` by `scripts/copy-vendor.mjs`. It runs automatically on install, `dev` and `build`; the folder is git-ignored.
- **Node built-ins in browser code:** qpdf's Emscripten glue imports `fs`/`path`/`crypto` in a Node-only branch. `next.config.ts` aliases them to `lib/shims/empty.ts` for the browser.
- **Multi-threaded WASM builds** (AVIF, OxiPNG, ONNX threads) need cross-origin isolation, which we don't enable. Some of them also deadlock the Turbopack build, so `lib/engines/image/single-thread-codecs.ts` loads the single-threaded builds directly.
- **Background remover** tries models best-first (`components/tools/remove-background/models.ts`): BiRefNet-lite (MIT) on GPUs that allow ≥11 storage buffers per shader, then ormbg (Apache-2.0) on WebGPU, then ormbg on CPU. Safari/iOS start at ormbg, because BiRefNet runs out of WASM memory there. Each failed model's worker is discarded (to free its WASM memory) and the failure is remembered in `localStorage`. To force a starting model when testing, set `localStorage["toolscraft:bg-model"] = "birefnet-gpu"`. Models download from Hugging Face on first use; only the model is downloaded, photos are never sent.
- **Compress PDF** re-encodes the images inside the PDF with MozJPEG (and scales down huge ones). Text and vector content are untouched, so text-only PDFs barely shrink.
- Encrypted PDFs: pdf-lib often can't tell they're encrypted, so `lib/engines/pdf/load.ts` checks for `/Encrypt` itself to give a clear message.

Note: this is Next.js 16 with Cache Components enabled. Read `node_modules/next/dist/docs/` before using unfamiliar APIs (e.g. `dynamicParams` is not allowed; read `params` inside `<Suspense>`).
