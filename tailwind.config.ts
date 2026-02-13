import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eafff7",
          100: "#bfffe8",
          200: "#7dffd1",
          300: "#36ffb5",
          400: "#10f3a2",
          500: "#00F5A0",
          600: "#10B981",
          700: "#0f8f67",
          800: "#0b6b4d"
        },
        night: {
          900: "#0B1120",
          800: "#0F172A",
          700: "#111827"
        }
      }
    }
  },
  plugins: []
};

export default config;
