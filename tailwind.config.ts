import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FBF7EE",
        sage: {
          DEFAULT: "#D8E1D2",
          dark: "#A9BBA0",
        },
        cantaloupe: {
          DEFAULT: "#FDA172",
          soft: "#FFB892",
          deep: "#E88A5C",
        },
        butter: {
          DEFAULT: "#FFD93D",
          soft: "#FFE970",
          deep: "#D4A91A",
        },
      },
      fontFamily: {
        serif: [
          "ui-serif",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "Times",
          "serif",
        ],
      },
      transitionDuration: {
        "150": "150ms",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.04)" },
          "60%": { transform: "scale(0.98)" },
          "100%": { transform: "scale(1)" },
        },
        "check-pop": {
          "0%": { transform: "scale(0)" },
          "60%": { transform: "scale(1.18)" },
          "100%": { transform: "scale(1)" },
        },
        "check-draw": {
          "0%": { strokeDashoffset: "16", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { strokeDashoffset: "0", opacity: "1" },
        },
      },
      animation: {
        pop: "pop 340ms ease-out",
        "check-pop": "check-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "check-draw":
          "check-draw 360ms ease-out 100ms forwards",
      },
    },
  },
  plugins: [],
};

export default config;
