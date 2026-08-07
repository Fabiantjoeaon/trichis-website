import { WebGPURenderer, NoToneMapping } from "three/webgpu";

/**
 * Async R3F `gl` factory: WebGPURenderer with automatic WebGL2 fallback.
 * Requests the adapter's full 2D texture limit (default device limit is
 * 8192, while large DatoCMS assets can exceed it).
 * @param {object} props — Canvas/gl constructor props from R3F
 */
export async function createWebGpuRenderer(props) {
  let requiredLimits;
  try {
    const adapter = await navigator.gpu?.requestAdapter?.({
      powerPreference: "high-performance",
    });
    if (adapter) {
      requiredLimits = {
        maxTextureDimension2D: adapter.limits.maxTextureDimension2D,
      };
    }
  } catch {
    // No WebGPU adapter — renderer falls back to WebGL2
  }

  const renderer = new WebGPURenderer({
    ...props,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
    requiredLimits,
  });
  renderer.toneMapping = NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  await renderer.init();
  return renderer;
}
