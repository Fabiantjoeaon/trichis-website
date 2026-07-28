// Central GSAP setup: register plugins once and share instances.
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(CustomEase, SplitText, useGSAP);
}

export { gsap, CustomEase, SplitText, useGSAP };
