import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Vibe Athletics brand tokens
        ink: "#0B1220",        // near-black navy — sidebar / dark surfaces
        surface: "#F5F6F8",    // app background
        card: "#FFFFFF",
        border: "#E4E7EC",
        muted: "#6B7280",
        volt: "#C6FF3D",       // signature electric volt-green accent
        "volt-dark": "#9FDB1E",
        flame: "#FF5A3C",      // secondary accent — cost / alerts / energy
        ok: "#16A34A",
        warn: "#F59E0B",
        danger: "#DC2626",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(11,18,32,0.04), 0 1px 3px 0 rgba(11,18,32,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
