import { create } from "zustand";

export const howWeDoItStore = create((set, get) => ({
  cardTransforms: [],
  addTransform: (transform, i) => {
    set((state) => {
      const existingIndex = state.cardTransforms.findIndex((t) => t.i === i);
      if (existingIndex !== -1) {
        const updated = [...state.cardTransforms];
        updated[existingIndex] = { transform, i };
        return { cardTransforms: updated };
      }
      return { cardTransforms: [...state.cardTransforms, { transform, i }] };
    });
  },
  getTotalWidth: () =>
    get().cardTransforms.reduce((acc, t) => acc + t.transform.scale.x, 0),
  getWidth: (i) => get().cardTransforms[i]?.transform.scale.x ?? 0,
  getPosition: (i) => get().cardTransforms[i]?.transform.position.x ?? 0,
}));

export const howWeDoItProgress = create(() => 0);
export const howWeDoItX = create(() => 0);
export const howWeDoItScale = create(() => 1);
export const howWeDoItTextTexture = create(() => null);

export const minScale = 0.9;
