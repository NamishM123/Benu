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
        cream: "#F5F1E8",
        sage: {
          DEFAULT: "#D8E1D2",
          dark: "#A9BBA0",
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
