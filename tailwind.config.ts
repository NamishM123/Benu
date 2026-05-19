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
        "cream-light": "#FFFBF2",
        "cream-dark": "#F7EFDE",
        // KDS deeper variants from the Claude Design package — match the
        // V3/V4 mockups exactly without disturbing the customer-app shades
        // above.
        "kds-cream": "#F4EEE2",
        "kds-cream-deep": "#EAE2D0",
        sage: {
          DEFAULT: "#D8E1D2",
          soft: "#DCE6CC",
          dark: "#A9BBA0",
        },
        "sage-kds": "#BFD0A8",
        "sage-kds-dark": "#6F8A56",
        cantaloupe: {
          DEFAULT: "#FDA172",
          soft: "#FFB892",
          deep: "#E88A5C",
        },
        "cantaloupe-kds": "#DC7B47",
        "cantaloupe-kds-soft": "#F4D6BC",
        "cantaloupe-kds-deep": "#A8501F",
        butter: {
          DEFAULT: "#FFD93D",
          soft: "#FFE970",
          deep: "#D4A91A",
        },
        "butter-kds": "#E8BE6C",
        "butter-kds-soft": "#F5E4BB",
        "butter-kds-deep": "#A87923",
      },
      boxShadow: {
        card: "0 1px 2px rgba(40,30,20,.05), 0 4px 14px rgba(40,30,20,.04)",
        "card-lift":
          "0 4px 14px rgba(40,30,20,.07), 0 16px 36px rgba(40,30,20,.06)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: ".35" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
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
    },
  },
  plugins: [],
};

export default config;
