import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#fef9e7",
          100: "#fcefc0",
          200: "#f9df8c",
          300: "#f5cf58",
          400: "#f0bf30",
          500: "#D4AF37",
          600: "#b8962e",
          700: "#8c7223",
          800: "#604e18",
          900: "#342a0d",
        },
        dark: {
          bg: "#000000",
          card: "#0a0a0a",
          border: "#1a1a1a",
          accent: "#D4AF37",
        },
      },
      fontFamily: {
        heading: ["Oswald", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
