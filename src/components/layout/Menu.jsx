// Port of nine-ca components/Menu/Menu.js — full-screen overlay menu.
// Links/contact/socials come from Site Settings props.
import { forwardRef, memo, useEffect, useImperativeHandle, useRef, useState } from "react";
import emitter from "@/lib/emitter";
import { events } from "@/lib/events";
import { useGlobalStore } from "@/stores/global";
import useEvent from "@/hooks/useEvent";
import useAnimation from "@/hooks/useAnimation";
import AnimatedHoverText from "@/components/ui/AnimatedHoverText";
import ShuffledText from "@/components/ui/ShuffledText";
import BorderedIcon from "@/components/ui/BorderedIcon";
import { TransitionLink } from "@/components/ui/TransitionLink";

const MenuItem = forwardRef(function MenuItem({ href, text, i }, ref) {
  const hoverText = useRef();

  useEvent(events.ROUTE_CHANGE_START, () => {
    hoverText.current?.animateOut();
    if (hoverText.current?.isHoverVisible()) {
      hoverText.current.triggerLeave();
    }
  });

  useImperativeHandle(ref, () => ({
    animateIn: () => {
      hoverText.current?.animateIn({
        delay: 0.1 * i,
        duration: 0.5,
        onComplete: () => hoverText.current?.toggleEnabled(true),
      });
    },
    animateOut: () => {
      hoverText.current?.animateOut({
        duration: 0.05,
        delay: 0,
        onStart: () => hoverText.current?.toggleEnabled(false),
      });
    },
  }));

  return (
    <TransitionLink href={href}>
      <AnimatedHoverText
        ref={hoverText}
        enabled={false}
        className="menu-link-wrapper"
        secondaryTextClassName="menu-link-bold"
      >
        {text}
      </AnimatedHoverText>
    </TransitionLink>
  );
});

const MAX_WIDTH = 2000;

export default memo(function Menu({ settings = {} }) {
  const wrapper = useRef();
  const menuLinks = useRef();
  const items = useRef([]);
  const isVisible = useRef(false);
  const closeIcon = useRef();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const { animateIn, animateOut: animateLinksOut } = useAnimation({
    inParams: {
      delay: 0.6,
      onStart: () => {
        closeIcon.current?.animateIn({ delay: 0.4 });
        items.current?.forEach((link, i) => {
          link?.animateIn({ duration: 0.4, delay: 0.1 * i });
        });
      },
      onComplete: () => {
        isVisible.current = true;
      },
    },
    outParams: {
      onStart: () => {
        isVisible.current = false;
        items.current.forEach((link) => link?.animateOut({ duration: 0.1 }));
        closeIcon.current?.animateOut();
      },
    },
  });

  function animateOut() {
    menuLinks.current?.classList.add("inactive");
    animateLinksOut();
    if (!useGlobalStore.getState().menuOpen) {
      emitter.emit(events.GL_BACKGROUND_OUT);
    }
  }

  function hide() {
    useGlobalStore.setState({ menuOpen: false });
    if (wrapper.current) wrapper.current.style.display = "none";
  }

  useEvent(events.MENU_OPEN, () => {
    useGlobalStore.setState({ menuOpen: true });
    emitter.emit(events.GL_BACKGROUND_IN);
    if (wrapper.current) wrapper.current.style.display = "flex";
    menuLinks.current?.classList.remove("inactive");
    animateIn();
  });

  useEvent(events.MENU_CLOSE, () => {
    useGlobalStore.setState({ menuOpen: false });
    animateOut();
  });
  useEvent(events.GL_BACKGROUND_OUT_COMPLETE, () => {
    if (!useGlobalStore.getState().menuOpen) {
      emitter.emit(events.MENU_OUT_COMPLETE);
    }
  });
  useEvent(events.MENU_OUT_COMPLETE, hide);
  useEvent(events.ROUTE_CHANGE_START, () => {
    if (useGlobalStore.getState().menuOpen) animateOut();
  });

  useEffect(() => {
    const applyWidth = () => {
      const windowWidth = window.innerWidth;
      const multiplier = windowWidth < MAX_WIDTH ? 8 : 2;
      wrapper.current?.style.setProperty("--menuWidthMultiplier", multiplier);
    };
    applyWidth();
    window.addEventListener("resize", applyWidth);
    return () => window.removeEventListener("resize", applyWidth);
  }, []);

  if (!isClient) return null;

  const navLinks = settings.navLinks?.length
    ? settings.navLinks
    : [
        { label: "Home", path: "/" },
        { label: "About us", path: "/about-us" },
        { label: "Projects", path: "/projects" },
        { label: "What we do", path: "/what-we-do" },
      ];

  const footer = settings.footer ?? {};
  const phone = footer.phone || "+31765156463";
  const email = footer.email || "cu@nine.nl";
  const socials = footer.socialLinks?.length
    ? footer.socialLinks
    : [
        { label: "LinkedIn", url: "https://www.linkedin.com/company/nine-nl/" },
        { label: "Instagram", url: "https://www.instagram.com/ninecreativeagency/" },
        { label: "Vimeo", url: "https://vimeo.com/nine" },
      ];

  let shuffleIndex = navLinks.length;

  return (
    <div className="menu" ref={wrapper}>
      <div className="menu__inner">
        <div className="menu__links" ref={menuLinks}>
          {navLinks.map((link, i) => (
            <MenuItem
              key={link.path}
              ref={(r) => (items.current[i] = r)}
              i={i}
              href={link.path}
              text={link.label}
            />
          ))}
        </div>
        <div className="menu__bottom">
          <div className="menu__contact">
            <a href={`tel:${phone.replace(/\s/g, "")}`}>
              <ShuffledText ref={(r) => (items.current[shuffleIndex++] = r)} text={phone} />
            </a>
            <a href={`mailto:${email}`}>
              <ShuffledText ref={(r) => (items.current[shuffleIndex++] = r)} text={email} />
            </a>
          </div>
          <div className="menu__socials">
            {socials.map((social) => (
              <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer">
                <ShuffledText
                  ref={(r) => (items.current[shuffleIndex++] = r)}
                  text={social.label}
                />
              </a>
            ))}
          </div>
        </div>

        <BorderedIcon
          icon="close"
          ref={closeIcon}
          onClick={() => emitter.emit(events.MENU_CLOSE)}
          animateOnScroll={false}
        />
      </div>
    </div>
  );
});
