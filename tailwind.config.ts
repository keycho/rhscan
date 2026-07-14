import type { Config } from "tailwindcss";

// light, dense, information-first. the palette follows the hoodscan design
// system: a cool near-white page, white surfaces, hairline borders instead of
// shadows, forest-green accents for links/live/positive states, and amber
// reserved strictly for indexing-honesty signals. colours are driven by css
// variables (channel triplets) declared in app/globals.css, so every colour
// supports the /opacity modifier and the whole palette lives in one place.
const rgb = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/web/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // page + surfaces
        bg: rgb("bg"),
        panel: rgb("surface"),
        panel2: rgb("subtle"),
        surface: rgb("surface"),
        subtle: rgb("subtle"),
        utility: rgb("utility"),
        hover: rgb("hover"),
        masthead: rgb("masthead"),
        // borders
        border: rgb("border"),
        "border-strong": rgb("border-strong"),
        "border-hair": rgb("border-hair"),
        "border-footer": rgb("border-footer"),
        // text
        text: rgb("text"),
        secondary: rgb("secondary"),
        tertiary: rgb("tertiary"),
        label: rgb("label"),
        muted: rgb("muted"),
        faint: rgb("muted"),
        // accents / states
        accent: rgb("green"),
        "accent-hover": rgb("green-hover"),
        green: rgb("green"),
        "green-dim": rgb("green-dim"),
        amber: rgb("amber"),
        ok: rgb("green"),
        bad: rgb("negative"),
        warn: rgb("amber"),
      },
      fontFamily: {
        mono: ["var(--font-plex-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      maxWidth: {
        page: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
