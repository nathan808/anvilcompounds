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
        display: ["var(--font-archivo)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
        logo: ["var(--font-oswald)", "sans-serif"],
      },
      // Numeric weight utilities (font-400 … font-900) are used throughout
      // components/ instead of Tailwind's named scale (font-bold etc.) —
      // without this, those classes don't exist and silently apply no
      // weight at all, which is why headings were rendering thinner than
      // the Archivo 800/900 the design calls for.
      fontWeight: {
        "400": "400",
        "500": "500",
        "600": "600",
        "700": "700",
        "800": "800",
        "900": "900",
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
