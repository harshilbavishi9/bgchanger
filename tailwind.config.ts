import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jira: {
          bg: "#F4F5F7",
          subtle: "#FAFBFC",
          card: "#FFFFFF",
          border: "#DFE1E6",
          borderHover: "#C1C7D0",
          text: "#172B4D",
          muted: "#5E6C84",
          primary: "#0052CC",
          primaryHover: "#0065FF",
          primaryActive: "#0747A6",
          success: "#36B37E",
          warning: "#FFAB00",
          danger: "#FF5630",
        },
      },
    },
  },
  plugins: [],
};

export default config;
