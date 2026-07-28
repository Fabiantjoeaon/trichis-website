import { useEffect, useMemo } from "react";
import { nextCanvasKey, useCanvasStore } from "@/lib/gl/canvasStore";

/**
 * Portal DOM-tree React nodes into the global WebGPU canvas (scroll-rig UseCanvas).
 */
export default function UseCanvas({ children, id }) {
  const key = useMemo(() => id || nextCanvasKey(), [id]);
  const add = useCanvasStore((s) => s.add);
  const update = useCanvasStore((s) => s.update);
  const remove = useCanvasStore((s) => s.remove);

  useEffect(() => {
    add(key, children);
    return () => remove(key);
  }, [key, add, remove]);

  useEffect(() => {
    update(key, children);
  }, [key, children, update]);

  return null;
}

export function CanvasChildren() {
  const entries = useCanvasStore((s) => s.entries);
  return (
    <>
      {Object.entries(entries).map(([key, node]) => (
        <group key={key}>{node}</group>
      ))}
    </>
  );
}
