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
          DEFAULT: "#FF7900",
          soft: "#FF944D",
          deep: "#CC6100",
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
