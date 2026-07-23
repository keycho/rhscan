import type { Config } from "tailwindcss";

// proof-of-bagwork-style terminal palette: near-black green-tinted background,
// thin muted green borders, bright terminal green accent, yellow/orange
// emphasis, pale-green highlight rows. all type is monospace.
// contrast + allocation series colors validated against --panel.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b100c",
        panel: "#121a13",
        panel2: "#162016",
        line: "#24382a",
        "line-strong": "#2f4a37",
        text: "#d7ecdc",
        secondary: "#9fc4aa",
        muted: "#7da88b",
        faint: "#567a63",
        accent: "#4ef08a",
        "accent-ink": "#06301a",
        amber: "#f2c94c",
        orange: "#fb923c",
        negative: "#ff6b6b",
        pale: "#b8e6c6",
        "pale-ink": "#123822",
      },
      fontFamily: {
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
        sans: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        "3xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      maxWidth: {
        page: "1080px",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "feed-in": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "row-flash": {
          from: { backgroundColor: "rgba(78, 240, 138, 0.12)" },
          to: { backgroundColor: "transparent" },
        },
        "modal-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "marquee-slow": "marquee 42s linear infinite",
        "marquee-fast": "marquee 30s linear infinite",
        "feed-in": "feed-in 0.35s ease-out",
        "row-flash": "row-flash 1.6s ease-out",
        "modal-in": "modal-in 0.18s ease-out",
        "toast-in": "toast-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
