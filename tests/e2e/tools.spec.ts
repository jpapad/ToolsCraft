import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";

async function pdf(pages: number, width: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) doc.addPage([width, 300]);
  return Buffer.from(await doc.save());
}

/** The privacy promise: no request may carry a body (no uploads of any kind). */
function trackUploads(page: Page) {
  const uploads: string[] = [];
  page.on("request", (req) => {
    if (req.method() !== "GET" && req.method() !== "HEAD") uploads.push(`${req.method()} ${req.url()}`);
  });
  return uploads;
}

test("home lists tools and search navigates to a tool", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Every file tool");
  await page.keyboard.press("ControlOrMeta+k");
  await page.getByPlaceholder("What do you want to do?").fill("merge");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/tools\/merge-pdf$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Merge PDF");
});

test("merge PDF: reorder, merge and download without uploading", async ({ page }) => {
  const uploads = trackUploads(page);
  await page.goto("/tools/merge-pdf");

  await page.locator('input[type="file"]').setInputFiles([
    { name: "first.pdf", mimeType: "application/pdf", buffer: await pdf(1, 100) },
    { name: "second.pdf", mimeType: "application/pdf", buffer: await pdf(2, 200) },
  ]);
  await expect(page.getByText("first.pdf")).toBeVisible();

  // Keyboard reorder: move "first.pdf" below "second.pdf".
  await page.getByRole("button", { name: "Reorder first.pdf" }).focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(300);
  await page.keyboard.press("Space");
  await expect(page.locator("li p[title]").first()).toHaveText("second.pdf");

  await page.getByRole("button", { name: "Merge PDFs" }).click();
  await expect(page.getByText("Done!")).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download" }).click()]);
  expect(download.suggestedFilename()).toBe("merged.pdf");
  const merged = await PDFDocument.load(await readFile(await download.path()));
  expect(merged.getPages().map((p) => p.getWidth())).toEqual([200, 200, 100]);

  expect(uploads).toEqual([]);
});

test("merge PDF: a broken file shows a clear error", async ({ page }) => {
  await page.goto("/tools/merge-pdf");
  await page.locator('input[type="file"]').setInputFiles([
    { name: "ok.pdf", mimeType: "application/pdf", buffer: await pdf(1, 100) },
    { name: "broken.pdf", mimeType: "application/pdf", buffer: Buffer.from("nope") },
  ]);
  await page.getByRole("button", { name: "Merge PDFs" }).click();
  await expect(page.getByText(/broken\.pdf. is not a valid PDF/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("JSON formatter formats, minifies and reports errors", async ({ page }) => {
  const uploads = trackUploads(page);
  await page.goto("/tools/json-formatter");
  const input = page.getByLabel("Input");
  const output = page.getByLabel("Output");

  await input.fill('{"b":1,"a":[1,2]}');
  await expect(output).toHaveValue('{\n  "b": 1,\n  "a": [\n    1,\n    2\n  ]\n}');

  await page.getByRole("tab", { name: "Minify" }).click();
  await page.getByLabel("Sort keys").click();
  await expect(output).toHaveValue('{"a":[1,2],"b":1}');

  await input.fill('{"a": }');
  await expect(page.getByText(/not valid JSON/)).toBeVisible();
  expect(uploads).toEqual([]);
});
