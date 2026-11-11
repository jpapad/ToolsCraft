import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? 3100);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [
    // Headless shell: no GPU, so AI tools take their CPU (WASM) path.
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Full Chromium with WebGPU, for the GPU path of AI tools only.
    {
      name: "webgpu",
      grep: /AI model/,
      use: { ...devices["Desktop Chrome"], channel: "chromium", launchOptions: { args: ["--enable-unsafe-webgpu"] } },
    },
    // Safari's engine, for the AI tools (it has its own WASM memory behavior).
    { name: "webkit", grep: /AI model/, use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    port,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
