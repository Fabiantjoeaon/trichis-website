import { create } from "zustand";

// Tunnel registry: DOM islands push React nodes into the global GL canvas
// without r3f-scroll-rig / tunnel-rat.
let keySeq = 0;
export const nextCanvasKey = () => `gl-${++keySeq}`;

export const useCanvasStore = create((set, get) => ({
  scaleMultiplier: 1,
  pageReflow: 0,
  entries: {},

  setScaleMultiplier: (scaleMultiplier) => set({ scaleMultiplier }),
  triggerReflow: () => set({ pageReflow: get().pageReflow + 1 }),

  add: (key, node) =>
    set({ entries: { ...get().entries, [key]: node } }),
  update: (key, node) => {
    if (!get().entries[key]) return;
    set({ entries: { ...get().entries, [key]: node } });
  },
  remove: (key) => {
    const next = { ...get().entries };
    delete next[key];
    set({ entries: next });
  },
}));
