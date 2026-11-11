import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

function trackUploads(page: Page) {
  const uploads: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET" && req.method() !== "HEAD") uploads.push(`${req.method()} ${req.url()}`);
  });
  return uploads;
}

/** Real image fixtures: a colorful screenshot of a page we control. */
async function makeImages(page: Page) {
  await page.setContent(
    `<div style="width:640px;height:400px;background:linear-gradient(45deg,#f43f5e,#6366f1,#10b981)"><h1 style="color:white;font:48px sans-serif;padding:40px">ToolsCraft</h1></div>`,
  );
  const clip = { x: 0, y: 0, width: 640, height: 400 };
  return {
    png: await page.screenshot({ clip, type: "png" }),
    jpeg: await page.screenshot({ clip, type: "jpeg", quality: 95 }),
  };
}

const MAGIC: Record<string, (b: Buffer) => boolean> = {
  jpg: (b) => b[0] === 0xff && b[1] === 0xd8,
  png: (b) => b.subarray(1, 4).toString() === "PNG",
  webp: (b) => b.subarray(8, 12).toString() === "WEBP",
  avif: (b) => b.subarray(4, 12).toString().startsWith("ftypavi"),
};

async function pdf(widths: number[]) {
  const doc = await PDFDocument.create();
  for (const w of widths) doc.addPage([w, 300]);
  return Buffer.from(await doc.save());
}

for (const [label, ext] of [
  ["WebP", "webp"],
  ["AVIF", "avif"],
  ["JPG", "jpg"],
  ["PNG", "png"],
] as const) {
  test(`image converter → ${label}`, async ({ page }) => {
    test.setTimeout(60_000);
    const { png } = await makeImages(page);
    const uploads = trackUploads(page);
    await page.goto("/tools/convert-image");
    await page.locator('input[type="file"]').setInputFiles({ name: "banner.png", mimeType: "image/png", buffer: png });
    await page.getByRole("tab", { name: label, exact: true }).click();
    await page.getByRole("button", { name: `Convert to ${label}` }).click();
    await expect(page.getByText("Done!")).toBeVisible({ timeout: 45_000 });

    const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download", exact: true }).click()]);
    expect(dl.suggestedFilename()).toBe(`banner.${ext}`);
    expect(MAGIC[ext](await readFile(await dl.path()))).toBe(true);
    expect(uploads).toEqual([]);
  });
}

test("image compressor: batch, before/after and ZIP", async ({ page }) => {
  test.setTimeout(60_000);
  const { png, jpeg } = await makeImages(page);
  await page.goto("/tools/compress-image");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "a.jpg", mimeType: "image/jpeg", buffer: jpeg },
    { name: "b.png", mimeType: "image/png", buffer: png },
  ]);
  await page.getByRole("button", { name: "Compress" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 45_000 });
  await expect(page.getByText("Compare", { exact: true })).toBeVisible();
  await expect(page.getByRole("img", { name: "Result" })).toBeVisible();

  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download all/ }).click()]);
  expect(dl.suggestedFilename()).toBe("compressed-images.zip");
  // The JPG must actually shrink at the default quality.
  await expect(page.locator("li").filter({ has: page.locator('p[title="a.jpg"]') })).toContainText(/\(-\d+%\)/);
});

test("images to PDF: one page per image, in order", async ({ page }) => {
  test.setTimeout(60_000);
  const { png, jpeg } = await makeImages(page);
  await page.goto("/tools/images-to-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "one.jpg", mimeType: "image/jpeg", buffer: jpeg },
    { name: "two.png", mimeType: "image/png", buffer: png },
  ]);
  await page.getByRole("button", { name: "Create PDF" }).click();
  await expect(page.getByText("Done!")).toBeVisible({ timeout: 30_000 });
  const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download", exact: true }).click()]);
  const doc = await PDFDocument.load(await readFile(await dl.path()));
  expect(doc.getPageCount()).toBe(2);
  expect(Math.round(doc.getPage(0).getWidth())).toBe(842); // landscape A4 for a wide image
});

test("split PDF by ranges gives a ZIP of files", async ({ page }) => {
  const uploads = trackUploads(page);
  await page.goto("/tools/split-pdf");
  await page.locator('input[type="file"]').setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: await pdf([100, 200, 300]) });
  await page.getByRole("tab", { name: "Ranges" }).click();
  await page.getByLabel("Pages").fill("1-2, 3");
  await page.getByRole("button", { name: "Split PDF" }).click();
  await expect(page.getByText("2 files")).toBeVisible();
  await expect(page.getByText("doc-pages-1-2.pdf")).toBeVisible();

  await page.getByRole("button", { name: "Start over" }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: "doc.pdf", mimeType: "application/pdf", buffer: await pdf([100]) });
  await page.getByLabel("Pages").fill("2");
  await page.getByRole("button", { name: "Split PDF" }).click();
  await expect(page.getByText(/outside the document/)).toBeVisible();
  expect(uploads).toEqual([]);
});

test("base64 encodes and decodes text", async ({ page }) => {
  await page.goto("/tools/base64");
  await page.getByLabel("Text", { exact: true }).fill("Καλημέρα");
  await expect(page.getByLabel("Base64", { exact: true })).toHaveValue("zprOsc67zrfOvM6tz4HOsQ==");
  await page.getByRole("tab", { name: "Decode" }).click();
  await page.getByLabel("Base64", { exact: true }).fill("SGVsbG8gd29ybGQ=");
  await expect(page.getByLabel("Text", { exact: true })).toHaveValue("Hello world");
});

test("QR code previews and downloads PNG and SVG", async ({ page }) => {
  await page.goto("/tools/qr-code-generator");
  await page.getByLabel("Link or text").fill("https://example.com");
  await expect(page.getByRole("img", { name: "QR code preview" })).toBeVisible();

  const [png] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "PNG" }).click()]);
  expect(MAGIC.png(await readFile(await png.path()))).toBe(true);
  const [svg] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "SVG" }).click()]);
  expect((await readFile(await svg.path(), "utf8")).startsWith("<svg")).toBe(true);

  await page.getByRole("tab", { name: "Wi-Fi" }).click();
  await expect(page.getByText("Enter a network name")).toBeVisible();
  await page.getByLabel("Network name (SSID)").fill("Home");
  await expect(page.getByRole("img", { name: "QR code preview" })).toBeVisible();
});

test("text case shows every case", async ({ page }) => {
  await page.goto("/tools/text-case-converter");
  await page.getByLabel("Your text").fill("user profile settings");
  await expect(page.getByText("userProfileSettings", { exact: true })).toBeVisible();
  await expect(page.getByText("USER_PROFILE_SETTINGS", { exact: true })).toBeVisible();
  await expect(page.getByText("3 words")).toBeVisible();
});
