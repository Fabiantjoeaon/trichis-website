// Port of nine-ca components/Navigation/NavigationBar.js
import { memo, useCallback, useRef, useState } from "react";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { useGlobalStore } from "@/stores/global";
import useEvent from "@/hooks/useEvent";
import SplitText from "@/components/ui/SplitText";
import AnimatedHoverText from "@/components/ui/AnimatedHoverText";
import Badge from "@/components/ui/Badge";
import Logo from "@/components/ui/Logo";
import { Divider } from "@/components/ui/Divider";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { t } from "@/lib/i18n";

const MobileMenuIcon = memo(function MobileMenuIcon() {
  const [animatedIn, setAnimatedIn] = useState(false);

  const animateIn = useCallback(() => setAnimatedIn(true), []);
  const animateOut = useCallback(() => setAnimatedIn(false), []);

  useEvent(events.MENU_OPEN, animateOut);
  useEvent(events.MENU_CLOSE, animateIn);
  useEvent(events.LOADING_OUT_COMPLETE, () => {
    setTimeout(animateIn, 500);
  });

  return (
    <div
      className={`nav-menu-icon ${animatedIn ? "active" : ""}`}
      onClick={() => emitter.emit(events.MENU_OPEN)}
    >
      <span></span>
      <span className="bar2"></span>
    </div>
  );
});

export default function NavigationBar({ siteName = "Nine Creative Agency" }) {
  const border = useRef();
  const logo = useRef();
  const [badge1, badge2] = [useRef(), useRef()];
  const menuText = useRef();
  const logoTextRef = useRef();

  const isMobileLayout = useGlobalStore((s) => s.isMobileLayout);
  const theme = useGlobalStore((s) => s.theme);

  const [badgesVisible, setBadgesVisible] = useState(false);

  function animateIn() {
    logoTextRef.current?.animateIn?.();
    border.current?.animateIn();
    badge1.current?.animateIn?.();
    badge2.current?.animateIn?.({ delay: 0.2 });
    logo.current?.animateIn?.();
    menuText.current?.animateIn?.();
    setBadgesVisible(true);
  }

  useEvent(events.LOADING_OUT_COMPLETE, () => {
    animateIn();
  });

  return (
    <header className="navigation">
      <TransitionLink href="/">
        {isMobileLayout ? (
          <Logo ref={logo} />
        ) : (
          <SplitText
            ref={logoTextRef}
            className="nav-logo"
            animateOnScroll={false}
            type="chars"
            tag="h2"
            animation="charClipped"
          >
            {siteName}
          </SplitText>
        )}
      </TransitionLink>
      {!isMobileLayout && (
        <AnimatedHoverText
          ref={menuText}
          className="nav-menu"
          onClick={() => emitter.emit(events.MENU_OPEN)}
        >
          {t("nav.menu")}
        </AnimatedHoverText>
      )}
      <div className="theme-switcher">
        <Badge
          ref={badge1}
          className={badgesVisible ? "active" : ""}
          selected={theme === "light"}
          onClick={() => emitter.emit(events.SWITCH_THEME, "light")}
        >
          {t("nav.light")}
        </Badge>
        <Badge
          ref={badge2}
          className={badgesVisible ? "active" : ""}
          selected={theme === "dark"}
          onClick={() => emitter.emit(events.SWITCH_THEME, "dark")}
        >
          {t("nav.dark")}
        </Badge>
      </div>
      {isMobileLayout && <MobileMenuIcon />}
      <Divider className="navigation__border-bottom" ref={border} />
    </header>
  );
}
