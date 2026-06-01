import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#04091A",
          900: "#0A1628",
          800: "#0D1F3C",
          700: "#122850",
          600: "#163264",
        },
        blue: {
          400: "#4D94F0",
          500: "#2E7DE0",
          600: "#1D6ADB",
          700: "#1558BF",
          800: "#0E469F",
        },
        ice: "#EEF4FF",
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(29,106,219,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(29,106,219,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid-60": "60px 60px",
      },
    },
  },
  plugins: [],
};

export default config;
