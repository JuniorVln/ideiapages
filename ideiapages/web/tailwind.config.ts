import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
          accent: "#075E54",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F7F7F7",
        },
        text: {
          DEFAULT: "#111827",
          muted: "#4B5563",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "65ch",
      },
    },
  },
  plugins: [],
};

export default config;
