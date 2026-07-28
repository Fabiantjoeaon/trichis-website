import { create } from "zustand";
import { Vector2 } from "three/webgpu";

export const gridStore = create(() => ({
  xy: new Vector2(),
  scrollState: null,
  progress: 0,
  horizontalProgress: 0,
  selectedProject: null,
}));
