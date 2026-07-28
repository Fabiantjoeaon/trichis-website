// Page transition orchestration for the Astro MPA build.
// Mirrors nine-ca's TransitionLink flow: emit ROUTE_CHANGE_START (GL wipe
// covers the page), wait for the wipe, then navigate. The next page load
// reveals itself (wipe out) from the chrome island.
import emitter from "./emitter";
import { events } from "./events";
import { wait } from "./math";
import { useGlobalStore } from "@/stores/global";

export const TRANSITION_DURATION = 800;

let isNavigating = false;

export async function navigateWithTransition(href) {
  if (isNavigating) return;
  isNavigating = true;

  try {
    useGlobalStore.getState().lenis?.stop();
    emitter.emit(events.ROUTE_CHANGE_START, { route: href });
    await wait(TRANSITION_DURATION);
    window.location.assign(href);
  } catch (error) {
    console.error("Navigation error:", error);
    isNavigating = false;
    useGlobalStore.getState().lenis?.start();
  }
}

// Session flag: loader plays only on the first page view; subsequent
// navigations get the shorter wipe reveal.
export const hasVisited = () => {
  try {
    return sessionStorage.getItem("trichis:visited") === "1";
  } catch {
    return false;
  }
};

export const markVisited = () => {
  try {
    sessionStorage.setItem("trichis:visited", "1");
  } catch {
    // ignore
  }
};
