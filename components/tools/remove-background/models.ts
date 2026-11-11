/**
 * Which AI model to run, chosen from the device's capabilities.
 *
 * - BiRefNet-lite (MIT): best quality for any subject. Needs WebGPU with at least
 *   11 storage buffers per shader (Apple GPUs in Chrome allow 10), and runs out of
 *   memory on CPU and in Safari.
 * - ormbg (Apache-2.0, ISNet-based): lighter, best on people, decent on objects.
 *   fp16 on GPU, 8-bit quantized on CPU.
 *
 * Browsers can report capabilities they can't deliver (Safari's WebGPU, for example,
 * can run out of memory), so models are tried in order and failures are remembered.
 */
export const MODELS = {
  "birefnet-gpu": { id: "onnx-community/BiRefNet_lite-ONNX", device: "webgpu", dtype: "fp16", sizeMB: 115, gpu: true },
  "ormbg-gpu": { id: "onnx-community/ormbg-ONNX", device: "webgpu", dtype: "fp16", sizeMB: 90, gpu: true },
  "ormbg-cpu": { id: "onnx-community/ormbg-ONNX", device: "wasm", dtype: "q8", sizeMB: 45, gpu: false },
} as const;

export type ModelKey = keyof typeof MODELS;

/** Best first. Each model's fallbacks are the ones after it. */
const ORDER: ModelKey[] = ["birefnet-gpu", "ormbg-gpu", "ormbg-cpu"];
const BIREFNET_MIN_STORAGE_BUFFERS = 11;
const FAILED_KEY = "toolscraft:bg-failed-models:v1";
/** Testing hook: force the starting model, e.g. localStorage["toolscraft:bg-model"] = "birefnet-gpu". */
const FORCE_KEY = "toolscraft:bg-model";

interface GpuLike {
  requestAdapter(): Promise<{ limits: { maxStorageBuffersPerShaderStage: number } } | null>;
}

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Models that already failed on this device (remembered so we don't re-download them). */
function failedModels(): ModelKey[] {
  try {
    return JSON.parse(readStorage(FAILED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function rememberFailure(key: ModelKey) {
  try {
    localStorage.setItem(FAILED_KEY, JSON.stringify([...new Set([...failedModels(), key])]));
  } catch {
    // Storage unavailable (private mode): we'll just retry next visit.
  }
}

/**
 * Safari (and every iOS browser, which all use WebKit) reports WebGPU limits that
 * pass our check, but BiRefNet then runs out of WASM memory (std::bad_alloc).
 */
function isWebKitBrowser() {
  const ua = globalThis.navigator?.userAgent ?? "";
  return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\//.test(ua);
}

async function bestSupported(): Promise<ModelKey> {
  const forced = readStorage(FORCE_KEY);
  if (forced && forced in MODELS) return forced as ModelKey;
  const gpu = (globalThis.navigator as Navigator & { gpu?: GpuLike }).gpu;
  try {
    const adapter = gpu ? await gpu.requestAdapter() : null;
    if (!adapter) return "ormbg-cpu";
    if (isWebKitBrowser()) return "ormbg-gpu";
    return adapter.limits.maxStorageBuffersPerShaderStage >= BIREFNET_MIN_STORAGE_BUFFERS ? "birefnet-gpu" : "ormbg-gpu";
  } catch {
    return "ormbg-cpu";
  }
}

/** Models to try, best first, skipping any that failed here before. Never empty. */
export async function modelChain(): Promise<ModelKey[]> {
  const start = await bestSupported();
  const failed = new Set(failedModels());
  const chain = ORDER.slice(ORDER.indexOf(start)).filter((k) => !failed.has(k));
  return chain.length ? chain : ["ormbg-cpu"];
}
