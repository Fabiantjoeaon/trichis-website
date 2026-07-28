// Module-level mouse state (mirror of nine-ca's mouseState store) — mutated
// on pointermove, read from RAF loops without triggering React renders.
export const mouseState = {
  mouse: { x: 0, y: 0 },
  normalized: { x: 0, y: 0 },
};

let bound = false;

export function bindMouse() {
  if (bound || typeof window === "undefined") return;
  bound = true;

  window.addEventListener(
    "pointermove",
    (e) => {
      mouseState.mouse.x = e.clientX;
      mouseState.mouse.y = e.clientY;
      mouseState.normalized.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseState.normalized.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true },
  );
}
