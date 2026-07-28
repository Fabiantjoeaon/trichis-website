// MPA replacement for nine-ca's TransitionLink: plays the GL wipe (via
// ROUTE_CHANGE_START), waits for it to cover the screen, then navigates.
// The next page reveals itself on load (see SiteChrome).
import { useCallback, useEffect, useState } from "react";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { wait } from "@/lib/math";
import { useGlobalStore } from "@/stores/global";

export const TRANSITION_DURATION = 800;

function normalizePath(path) {
  if (!path) return "/";
  const bare = path.split("?")[0].split("#")[0];
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

export async function handleRouteChange(href) {
  try {
    useGlobalStore.getState().lenis?.stop();
    emitter.emit(events.ROUTE_CHANGE_START, { route: href });
    await wait(TRANSITION_DURATION);
    sessionStorage.setItem("trichis:navigated", "1");
    window.location.assign(href);
  } catch (error) {
    console.error("Navigation error:", error);
    useGlobalStore.getState().lenis?.start();
  }
}

export const TransitionLink = ({
  href = "/",
  children,
  enabled = true,
  className = "",
  ...props
}) => {
  // SSR + first client paint must match; resolve same-route after mount.
  const [isSameRoute, setIsSameRoute] = useState(false);

  useEffect(() => {
    setIsSameRoute(
      normalizePath(window.location.pathname) === normalizePath(href),
    );
  }, [href]);

  const shouldStartAnimation = useCallback(
    (e) => {
      if (e.button === 0 && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
        return !isSameRoute;
      }
      if (e.button === 1 || e.button === 2) return false;
      if (e.type === "click" && e.detail === 0) return true;
      return false;
    },
    [isSameRoute],
  );

  const handleClick = async (e) => {
    if (e.type === "keydown" && e.key !== "Enter") return;
    e.preventDefault();
    if (shouldStartAnimation(e)) await handleRouteChange(href);
  };

  if (!enabled) return <>{children}</>;

  return (
    <a
      href={href}
      className={className}
      style={{
        cursor: isSameRoute ? "default" : "pointer",
        pointerEvents: isSameRoute ? "none" : "auto",
      }}
      onClick={handleClick}
      onKeyDown={handleClick}
      tabIndex={0}
      {...props}
    >
      {children}
    </a>
  );
};

export default TransitionLink;
