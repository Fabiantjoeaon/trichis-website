import { useEffect, useRef } from "react";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { useGlobalStore } from "@/stores/global";

/**
 * Runs `handler` once when the page becomes visible: on LOADING_OUT_COMPLETE
 * (loader out on first view / wipe out after a client-side navigation), or
 * immediately when the component mounts after the reveal already happened —
 * islands can hydrate later than the chrome emits the event, so a plain
 * event listener would miss it.
 */
export default function usePageEnter(handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const fired = useRef(false);

  useEffect(() => {
    const run = () => {
      if (fired.current) return;
      fired.current = true;
      handlerRef.current?.();
    };

    if (useGlobalStore.getState().pageRevealed) run();
    const off = emitter.on(events.LOADING_OUT_COMPLETE, run);
    return () => off();
  }, []);
}
