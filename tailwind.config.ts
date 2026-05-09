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
    },
  },
  plugins: [],
};

export default config;
