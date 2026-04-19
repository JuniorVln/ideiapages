/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#060608',
        surface: 'rgba(255, 255, 255, 0.04)',
        surfaceHover: 'rgba(255, 255, 255, 0.07)',
        accent: {
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        cta: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        },
        primary: '#E2E8F0',
        muted: '#94A3B8'
      },
      fontFamily: {
        sans: ['DM Sans', 'Inter', 'sans-serif'],
        display: ['Space Grotesk', 'Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
