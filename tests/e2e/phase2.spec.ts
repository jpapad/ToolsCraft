import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { unpredictPng } from "@/components/tools/pdf-compress/compress";

async function textPdf(pages: number, size: [number, number] = [595, 842]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++) {
    const p = doc.addPage(size);
    p.drawText(`Page ${i + 1}`, { x: 50, y: size[1] - 100, size: 48, font, color: rgb(0.1, 0.1, 0.4) });
  }
  return Buffer.from(await doc.save());
}

async function download(page: Page, name: RegExp | string) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name, exact: typeof name === "string" }).click()]);
  return { name: dl.suggestedFilename(), bytes: await readFile(await dl.path()) };
}

/**
 * Reads alpha values from an 8-bit RGBA PNG in Node, so the check doesn't depend on
 * the browser under test (canvas readback is unreliable in WebKit).
 */
function decodeAlpha(png: Buffer) {
  const width = png.readUInt32BE(16);
  if (png[24] !== 8 || png[25] !== 6) throw new Error("expected an 8-bit RGBA PNG");
  const idat: Buffer[] = [];
  for (let pos = 8; pos < png.length; ) {
    const len = png.readUInt32BE(pos);
    if (png.toString("latin1", pos + 4, pos + 8) === "IDAT") idat.push(png.subarray(pos + 8, pos + 8 + len));
    pos += 12 + len;
  }
  const height = png.readUInt32BE(20);
  const pixels = unpredictPng(inflateSync(Buffer.concat(idat)), width, 4);
  return { width, height, at: (x: number, y: number) => pixels[(y * width + x) * 4 + 3] };
}

function trackUploads(page: Page) {
  const uploads: string[] = [];
  page.on("request", (r) => {
    if (r.method() !== "GET" && r.method() !== "HEAD") uploads.push(r.url());
  });
  return uploads;
}

test("PDF to images renders selected pages as PNG", async ({ page }) => {
  const uploads = trackUploads(page);
  await page.goto("/tools/pdf-to-images");
  await page.locator('input[type="file"]').setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: await textPdf(3) });
  await page.getByLabel("Pages (optional)").fill("1, 3");
  await page.getByRole("button", { name: "Convert to images" }).click();
  await expect(page.getByText("2 files")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("doc-page-3.png")).toBeVisible();
  expect(uploads).toEqual([]);
});

test("organize PDF: delete and rotate pages", async ({ page }) => {
  await page.goto("/tools/organize-pdf");
  await page.locator('input[type="file"]').setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: await textPdf(3) });
  await expect(page.getByText("3 of 3 pages")).toBeVisible();
  await expect(page.locator("li img")).toHaveCount(3, { timeout: 20_000 }); // thumbnails rendered
  await page.getByRole("button", { name: "Delete page 2" }).click();
  await page.getByRole("button", { name: "Rotate page 1 right" }).click();
  await expect(page.getByText("2 of 3 pages")).toBeVisible();

  const out = await download(page, /Save PDF/);
  const doc = await PDFDocument.load(out.bytes);
  expect(doc.getPageCount()).toBe(2);
  expect(doc.getPage(0).getRotation().angle).toBe(90);
});

test("watermark PDF adds an image to every page", async ({ page }) => {
  await page.goto("/tools/watermark-pdf");
  await page.locator('input[type="file"]').first().setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: await textPdf(2) });
  await page.getByLabel("Text", { exact: true }).fill("ΕΜΠΙΣΤΕΥΤΙΚΟ");
  await page.getByRole("button", { name: "Add watermark" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 20_000 });
  const out = await download(page, "Download");
  expect(out.name).toBe("doc-watermarked.pdf");
  const doc = await PDFDocument.load(out.bytes);
  expect(doc.getPageCount()).toBe(2);
  // The watermark image should be referenced from each page's resources.
  const xobjects = doc.getPages().map((p) => p.node.Resources()?.toString() ?? "");
  expect(xobjects.every((r) => r.includes("XObject"))).toBe(true);
});

test("protect then unlock a PDF with qpdf", async ({ page }) => {
  const uploads = trackUploads(page);
  await page.goto("/tools/protect-pdf");
  await page.locator('input[type="file"]').setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: await textPdf(1) });
  await page.getByLabel("New password").fill("s3cret!");
  await page.getByLabel("Confirm password").fill("s3cret!");
  await page.getByRole("button", { name: "Protect PDF" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 20_000 });
  const locked = await download(page, "Download");
  expect(locked.bytes.toString("latin1")).toContain("/Encrypt");

  await page.getByRole("tab", { name: "Unlock" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "locked.pdf", mimeType: "application/pdf", buffer: locked.bytes });
  await page.getByLabel("Current password").fill("wrong");
  await page.getByRole("button", { name: "Unlock PDF" }).click();
  await expect(page.getByText("Wrong password")).toBeVisible({ timeout: 20_000 });

  await page.getByLabel("Current password").fill("s3cret!");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 20_000 });
  const unlocked = await download(page, "Download");
  expect((await PDFDocument.load(unlocked.bytes)).getPageCount()).toBe(1);
  expect(uploads).toEqual([]);
});

test("resize images by pixels and crop to a square", async ({ page }) => {
  await page.setContent(`<div style="width:800px;height:400px;background:linear-gradient(90deg,#f43f5e,#6366f1)"></div>`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 800, height: 400 }, type: "png" });

  await page.goto("/tools/resize-image");
  await page.locator('input[type="file"]').setInputFiles({ name: "wide.png", mimeType: "image/png", buffer: png });
  await page.getByLabel("Width (px)").fill("200");
  await page.getByRole("button", { name: "Resize" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 20_000 });
  const resized = await download(page, "Download");
  // PNG IHDR: width at byte 16, height at byte 20.
  expect([resized.bytes.readUInt32BE(16), resized.bytes.readUInt32BE(20)]).toEqual([200, 100]);

  await page.getByRole("tab", { name: "Crop" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "wide.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "1:1" }).click();
  await expect(page.getByText("Result: 400 × 400 px")).toBeVisible();
  const cropped = await download(page, /Crop & download/);
  expect(cropped.name).toBe("wide-cropped.png");
  expect([cropped.bytes.readUInt32BE(16), cropped.bytes.readUInt32BE(20)]).toEqual([400, 400]);
});

/** A photo-like JPEG (noise + gradient) made in the browser, so it doesn't compress trivially. */
async function photoJpeg(page: Page, width: number, height: number, quality = 0.98) {
  const dataUrl = await page.evaluate(
    ({ width, height, quality }) => {
      const c = document.createElement("canvas");
      c.width = width;
      c.height = height;
      const ctx = c.getContext("2d")!;
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, "#0ea5e9");
      g.addColorStop(1, "#f43f5e");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      const img = ctx.getImageData(0, 0, width, height);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 60;
        img.data[i] += n;
        img.data[i + 1] += n;
        img.data[i + 2] += n;
      }
      ctx.putImageData(img, 0, 0);
      return c.toDataURL("image/jpeg", quality);
    },
    { width, height, quality },
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

test("compress PDF shrinks an image-heavy document", async ({ page }) => {
  test.setTimeout(60_000);
  const uploads = trackUploads(page);
  await page.goto("/");
  const doc = await PDFDocument.create();
  for (let i = 0; i < 2; i++) {
    const img = await doc.embedJpg(await photoJpeg(page, 2400, 1600));
    doc.addPage([842, 595]).drawImage(img, { x: 0, y: 0, width: 842, height: 595 });
  }
  const input = Buffer.from(await doc.save());

  await page.goto("/tools/compress-pdf");
  await page.locator('input[type="file"]').setInputFiles({ name: "photos.pdf", mimeType: "application/pdf", buffer: input });
  await page.getByRole("button", { name: "Compress PDF" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 45_000 });
  const out = await download(page, "Download");
  expect(out.name).toBe("photos-compressed.pdf");
  expect(out.bytes.length).toBeLessThan(input.length * 0.6);
  expect((await PDFDocument.load(out.bytes)).getPageCount()).toBe(2);
  expect(uploads).toEqual([]);
});

test("compress PDF explains when there's nothing to compress", async ({ page }) => {
  await page.goto("/tools/compress-pdf");
  await page.locator('input[type="file"]').setInputFiles({ name: "text.pdf", mimeType: "application/pdf", buffer: await textPdf(1) });
  await page.getByRole("button", { name: "Compress PDF" }).click();
  await expect(page.getByText(/no images to compress/)).toBeVisible({ timeout: 20_000 });
});

// Downloads the real ~115–220 MB model, so it only runs when asked: RUN_AI_TESTS=1 npx playwright test
test("background remover cuts out the subject (AI model)", async ({ page }) => {
  test.skip(!process.env.RUN_AI_TESTS, "set RUN_AI_TESTS=1 to run");
  test.setTimeout(600_000);
  await page.setContent(
    `<div style="width:512px;height:512px;background:#22c55e;display:grid;place-items:center"><div style="width:260px;height:260px;border-radius:50%;background:#1e3a8a"></div></div>`,
  );
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 512, height: 512 }, type: "png" });
  await page.goto("/tools/remove-background");
  await page.locator('input[type="file"]').setInputFiles({ name: "circle.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Remove background" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 580_000 });
  const out = await download(page, "Download");
  expect(out.name).toBe("circle-no-bg.png");

  // The corner (background) should now be transparent, the center (subject) opaque.
  // (Measured relative to size: Safari-like devices render the fixture at 2× pixel density.)
  const img = decodeAlpha(out.bytes);
  const alpha = { corner: img.at(5, 5), center: img.at(img.width >> 1, img.height >> 1) };
  expect(alpha.corner).toBeLessThan(40);
  expect(alpha.center).toBeGreaterThan(200);
});

// Forces the heaviest model first: wherever it can't run, the tool must fall back to a
// lighter one in a fresh worker and remember the failure (the Safari out-of-memory case).
test("background remover falls back to a lighter model (AI model)", async ({ page }) => {
  test.skip(!process.env.RUN_AI_TESTS, "set RUN_AI_TESTS=1 to run");
  test.setTimeout(600_000);
  await page.setContent(`<div style="width:256px;height:256px;background:#22c55e;display:grid;place-items:center"><div style="width:120px;height:120px;border-radius:50%;background:#1e3a8a"></div></div>`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 256, height: 256 } });

  await page.goto("/tools/remove-background");
  await page.evaluate(() => {
    localStorage.removeItem("toolscraft:bg-failed-models:v1");
    localStorage.setItem("toolscraft:bg-model", "birefnet-gpu");
  });
  await page.reload();
  await page.locator('input[type="file"]').setInputFiles({ name: "x.png", mimeType: "image/png", buffer: png });
  await page.getByRole("button", { name: "Remove background" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 580_000 });

  const failed = await page.evaluate(() => JSON.parse(localStorage.getItem("toolscraft:bg-failed-models:v1") ?? "[]"));
  expect(failed).toContain("birefnet-gpu");
});
