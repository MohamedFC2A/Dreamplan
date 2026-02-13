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
        cyber: {
          50: "#e0fffe",
          100: "#b3fffc",
          200: "#80fff9",
          300: "#4dfff6",
          400: "#26fff3",
          500: "#00f0ff",
          600: "#00c4cc",
          700: "#009399",
          800: "#006366",
          900: "#003233",
        },
        dark: {
          bg: "#0a0a0f",
          card: "#12121a",
          border: "#1e1e2e",
          accent: "#00f0ff",
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
