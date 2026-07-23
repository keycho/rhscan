import type { Config } from "tailwindcss";

// dark terminal palette for the pof showcase. single fixed theme — the product
// is a dark web3 terminal by design. donut/series colors live in data/mock-data
// and were validated for CVD separation + contrast against --panel.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070a08",
        panel: "#0d100e",
        panel2: "#121613",
        line: "#1e2420",
        "line-strong": "#2a332d",
        text: "#e8f0ea",
        secondary: "#a3b3aa",
        muted: "#7d8c83",
        faint: "#5a6660",
        accent: "#14f195",
        "accent-deep": "#0c8f5a",
        "accent-ink": "#052e1c",
        amber: "#f5b62e",
        negative: "#ff6b6b",
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
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
        "3xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      maxWidth: {
        page: "1240px",
      },
      keyframes: {
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "feed-in": {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "row-flash": {
          from: { backgroundColor: "rgba(20, 241, 149, 0.10)" },
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
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "spin-slow": "spin-slow 48s linear infinite",
        "feed-in": "feed-in 0.35s ease-out",
        "row-flash": "row-flash 1.6s ease-out",
        "modal-in": "modal-in 0.18s ease-out",
        "toast-in": "toast-in 0.25s ease-out",
        blink: "blink 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
