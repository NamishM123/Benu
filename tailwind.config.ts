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
          DEFAULT: "#FFEAA8",
          soft: "#FFF3CC",
          deep: "#E8C871",
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
