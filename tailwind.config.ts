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
          50: "#f2fbfa",
          100: "#d8f5ef",
          500: "#0f766e",
          600: "#0b5f59",
          700: "#084c47"
        },
        sand: "#f5f1e9"
      }
    }
  },
  plugins: []
};

export default config;
