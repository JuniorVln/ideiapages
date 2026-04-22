import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1e40af",
          "primary-dark": "#1e3a8a",
          cta: "#25D366",
          "cta-dark": "#128C7E",
          DEFAULT: "#1e40af",
          dark: "#128C7E",
          accent: "#075E54",
        },
        surface: {
          DEFAULT: "#ffffff",
          alt: "#f8fafc",
          card: "#f1f5f9",
        },
        text: {
          DEFAULT: "#0f172a",
          muted: "#475569",
          subtle: "#94a3b8",
        },
        border: {
          DEFAULT: "#e2e8f0",
          focus: "#1e40af",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "65ch",
        container: "75rem",
      },
      spacing: {
        section: "4rem",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        modal: "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
