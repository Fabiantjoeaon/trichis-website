import { BufferGeometry, BufferAttribute, Vector3 } from "three/webgpu";

function createFullscreenTriangle() {
  const geometry = new BufferGeometry();
  // Clip-space triangle (covers NDC); z=0 so vertexNode can emit vec4(xy,0,1)
  const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]);
  const uvs = new Float32Array([0, 0, 2, 0, 0, 2]);

  geometry.setAttribute("position", new BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new BufferAttribute(uvs, 2));
  geometry.boundingSphere = {
    center: new Vector3(1, 1, 0),
    radius: 0,
  };

  return geometry;
}

export const fullscreenTriangle = createFullscreenTriangle();

export function planeFitPerspectiveCamera(plane, camera, relativeZ = null) {
  const cameraZ = relativeZ !== null ? relativeZ : camera.position.z;
  const distance = cameraZ - plane.position.z;
  const vFov = (camera.fov * Math.PI) / 180;
  const scaleY = 2 * Math.tan(vFov / 2) * distance;
  const scaleX = scaleY * camera.aspect;
  return { x: Math.abs(scaleX), y: Math.abs(scaleY), distance };
}
