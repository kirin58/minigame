import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"IBM Plex Sans Thai"',
          '"Noto Sans Thai"',
          "Inter",
          "-apple-system",
          '"Segoe UI"',
          "sans-serif",
        ],
        mono: ['"IBM Plex Mono"', "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
