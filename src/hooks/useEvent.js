import { useEffect, useRef } from "react";
import emitter from "@/lib/emitter";

// Subscribe to an app event for the lifetime of the component.
export default function useEvent(type, handler, deps = []) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const cb = (payload) => handlerRef.current(payload);
    emitter.on(type, cb);
    return () => emitter.off(type, cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}
