import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#08335A",
          dark: "#062947",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#359ACF",
          foreground: "#FFFFFF",
        },
        border: {
          DEFAULT: "#D7EBF2",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Poppins", "sans-serif"],
        body: ["var(--font-body)", "Nunito", "sans-serif"],
        sans: ["var(--font-body)", "Nunito", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        DEFAULT: "0.5rem",
      },
      boxShadow: {
        panel: "0 1px 3px rgba(8, 51, 90, 0.08)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
