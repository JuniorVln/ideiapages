import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#1e40af",
          "primary-dark": "#1e3a8a",
          /** Texto / superfícies escuras da marca (não confundir com verde WhatsApp) */
          dark: "#0f172a",
          cta: "#25D366",
          "cta-dark": "#128C7E",
          DEFAULT: "#1e40af",
          accent: "#075E54",
        },
        neutral: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
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
        /** Ideia Chat — primary = azul geral; chat = #2282C7 (UI marca: eyebrow, círculos de passo) */
        ideia: {
          primary: "#1e40af",
          "primary-dark": "#1e3a8a",
          /** Tom Ideia Chat (eyebrow, números em círculos em fundos escuros) */
          chat: "#2282C7",
          "chat-dark": "#1B6A9E",
          secondary: "#60a5fa",
          accent: "#93c5fd",
          link: "#2563eb",
          bg: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
        ideia: ["var(--font-maven)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        display: "-0.02em",
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
