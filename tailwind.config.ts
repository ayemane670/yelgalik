import type { Config } from "tailwindcss";

// DESIGN TOKENS — يلقالك
// Concept: a live souk ledger, not a generic SaaS card kit.
// Base: warm paper (#FAF8F4) — closer to unbleached paper than the common AI "cream+terracotta" combo.
// Primary: deep zellige teal (#0E6E5C) — trust, money, growth — a nod to Algerian tilework, not flag colors.
// Signal: amber-flame (#E8A33D) for "match found" moments — scarce, used only for live/urgent match signals.
// Ink: near-warm-black (#211D18) for text, never pure #000/#111.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F4",
        paperDim: "#F1ECE2",
        ink: "#211D18",
        inkSoft: "#5B5347",
        teal: { DEFAULT: "#0E6E5C", dark: "#0A4F42", light: "#E4F1EE" },
        flame: { DEFAULT: "#E8A33D", dark: "#C97F1E", light: "#FBF0DD" },
        line: "#E4DED2",
        danger: "#B3432B",
      },
      fontFamily: {
        // Display/Arabic headings: Tajawal (geometric, confident, reads well large)
        display: ["var(--font-tajawal)", "sans-serif"],
        // Body/Arabic + Latin numerals: IBM Plex Sans Arabic (clean at small sizes for prices/specs)
        body: ["var(--font-plex-arabic)", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(33,29,24,0.06), 0 1px 0 rgba(33,29,24,0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
