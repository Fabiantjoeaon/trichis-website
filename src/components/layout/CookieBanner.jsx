// Port of nine-ca components/CookieBanner.js
import { useCallback, useEffect, useRef, useState } from "react";
import { wait } from "@/lib/math";
import { useCSSClassTransition } from "@/hooks/useAnimation";
import BorderedIcon from "@/components/ui/BorderedIcon";

export default function CookieBanner({ content = {} }) {
  const acceptIcon = useRef();
  const rejectIcon = useRef();
  const wrapper = useRef();
  const { animateIn, animateOut } = useCSSClassTransition({ element: wrapper });

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cookieConsent");
      setVisible(!(stored === "accepted" || stored === "rejected"));
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (visible) animateIn();
  }, [visible, animateIn]);

  useEffect(() => {
    if (!visible) return;
    acceptIcon.current?.animateIn?.({ delay: 0 });
    rejectIcon.current?.animateIn?.({ delay: 0 });

    let cancelled = false;
    (async () => {
      await wait(50);
      if (cancelled) return;
      acceptIcon.current?.animateIn?.({ delay: 0 });
      rejectIcon.current?.animateIn?.({ delay: 0 });
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const storeConsent = useCallback(
    (value) => {
      try {
        localStorage.setItem("cookieConsent", value);
        localStorage.setItem("cookieConsentAt", String(Date.now()));
      } catch {}
      animateOut();
      wait(1000).then(() => setVisible(false));
    },
    [animateOut],
  );

  if (!visible) return null;

  const { title, message, accept: acceptLabel, reject: rejectLabel } = content;
  if (!message && !title) return null;

  return (
    <div
      className="cookie-banner"
      ref={wrapper}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      {title && <h5>{title}</h5>}
      <p>
        {message}
        {content.privacyUrl && content.moreLabel && (
          <>
            &nbsp;
            <span className="more-info">
              <a href={content.privacyUrl}>{content.moreLabel}</a>
            </span>
          </>
        )}
      </p>
      <div className="cookie-buttons">
        {acceptLabel && (
          <BorderedIcon
            ref={acceptIcon}
            animateOnScroll={false}
            onClick={() => storeConsent("accepted")}
            role="button"
            aria-label={acceptLabel}
            disableSplitText
            size="80rem"
            text={acceptLabel}
          />
        )}
        {rejectLabel && (
          <BorderedIcon
            ref={rejectIcon}
            animateOnScroll={false}
            onClick={() => storeConsent("rejected")}
            role="button"
            aria-label={rejectLabel}
            disableSplitText
            size="80rem"
            text={rejectLabel}
          />
        )}
      </div>
    </div>
  );
}
