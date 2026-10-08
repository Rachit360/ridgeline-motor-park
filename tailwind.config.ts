import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chalk: "#EDEFEA",
        paper: "#F8F9F6",
        tarmac: "#1E2327",
        steel: "#6B7780",
        line: "#C9CEC8",
        kerb: "#C4122F",
        flag: "#E8B421",
        pitgreen: "#2F7D4F",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', "sans-serif"],
        sans: ["Archivo", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
