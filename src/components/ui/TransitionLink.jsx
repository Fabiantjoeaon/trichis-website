// Port of nine-ca's TransitionLink for the Astro build. The GL wipe itself
// is woven into Astro's router lifecycle by SiteChrome (astro:before-
// preparation covers the screen, astro:page-load reveals it), so this only
// needs to hand the navigation to the ClientRouter — every navigation
// (including plain links and back/forward) gets the same transition.
import { useCallback, useEffect, useState } from "react";
import { navigate } from "astro:transitions/client";

export { TRANSITION_DURATION } from "@/lib/transitions";

function normalizePath(path) {
  if (!path) return "/";
  const bare = path.split("?")[0].split("#")[0];
  if (bare.length > 1 && bare.endsWith("/")) return bare.slice(0, -1);
  return bare || "/";
}

let isNavigating = false;

export async function handleRouteChange(href) {
  if (isNavigating) return;
  isNavigating = true;

  try {
    await navigate(href);
  } catch (error) {
    console.error("Navigation error:", error);
    // Full-page fallback; the loader plays a quick reveal on the next load
    try {
      sessionStorage.setItem("trichis:navigated", "1");
    } catch {}
    window.location.assign(href);
  } finally {
    isNavigating = false;
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
  // Links in the persisted chrome island (nav/menu) survive navigations, so
  // re-resolve after every swap or e.g. the "Home" link stays disabled.
  const [isSameRoute, setIsSameRoute] = useState(false);

  useEffect(() => {
    const update = () =>
      setIsSameRoute(
        normalizePath(window.location.pathname) === normalizePath(href),
      );
    update();
    document.addEventListener("astro:after-swap", update);
    return () => document.removeEventListener("astro:after-swap", update);
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
