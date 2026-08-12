/** @type {import('tailwindcss').Config} */

// Palette ported 1:1 from nine-ca src/common/theme.js
const palette = {
  white: "#ffffff",
  black: "#000000",

  grey: "#BFBFBF",
  greyLight1: "#D5D5D5",

  nevada: "#5C6566",
  aquaMarine: "#00FFC2",
  stromboli: "#376A5D",

  iron: "#EAEAEA",
  ironDarker: "#dbd9d9",
  outerSpace: "#2B393B",
  outerSpaceLight: "#333E40",
  outerSpaceDark: "#5A6466",

  pastelPink: "#FFD4E5",

  tuatara: "#232323",
  mineShaft: "#262626",
  nobel: "#B7B7B7",
};

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}"],
  // nine-ca ships its own reset (ported into global.css); Tailwind's preflight
  // would fight it and change rendering.
  corePlugins: {
    preflight: false,
  },
  theme: {
    // nine-ca breakpoints: tablet 712, desktop 1025 (+min-height 600), desktopLarge 1280
    screens: {
      tablet: "712px",
      desktop: "1025px",
      desktopLarge: "1280px",
    },
    extend: {
      fontFamily: {
        sans: ['"SG Grotesk"', "sans-serif"],
        display: ['"AG Book Stencil"', "sans-serif"],
      },
      colors: {
        ...palette,
        // Theme-aware semantic colors, driven by CSS vars set per theme
        // (light/dark/pink) in global.css — mirrors nine-ca themesMap.
        background: "var(--color-background)",
        backgroundAccent: "var(--color-backgroundAccent)",
        backgroundAccentLight: "var(--color-backgroundAccentLight)",
        text: "var(--color-text)",
        inactiveText: "var(--color-inactiveText)",
        secondaryText: "var(--color-secondaryText)",
        scrollTextBackground: "var(--color-scrollTextBackground)",
        accent: "var(--color-accent)",
        accent2: "var(--color-accent2)",
        menuBackground: "var(--color-menuBackground)",
        menuBackgroundText: "var(--color-menuBackgroundText)",
        menuText: "var(--color-menuText)",
        projectMeta: "var(--color-projectMeta)",
        howWeDoItText: "var(--color-howWeDoItText)",
        floatingTitle: "var(--color-floatingTitle)",
        smallDivider: "var(--color-smallDivider)",
        heroGridSecondary: "var(--color-heroGridSecondary)",
      },
      spacing: {
        nav: "var(--navigationHeight)",
        base: "var(--basePadding)",
        page: "var(--pagePadding)",
      },
      maxWidth: {
        site: "2000px",
      },
    },
  },
  plugins: [],
};
