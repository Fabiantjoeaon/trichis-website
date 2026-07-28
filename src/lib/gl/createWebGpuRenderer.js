import { WebGPURenderer, NoToneMapping } from "three/webgpu";

/**
 * Async R3F `gl` factory: WebGPURenderer with automatic WebGL2 fallback.
 * @param {object} props — Canvas/gl constructor props from R3F
 */
export async function createWebGpuRenderer(props) {
  const renderer = new WebGPURenderer({
    ...props,
    antialias: false,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.toneMapping = NoToneMapping;
  await renderer.init();
  return renderer;
}
