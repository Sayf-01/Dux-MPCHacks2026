import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#FFD74E",
          strong: "#5E1E29",
          soft: "#FFE380",
          ink: "#6B2433",
        },
        cream: {
          DEFAULT: "#F5EFE6",
          2: "#EDE6DC",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          2: "#F8F3EE",
        },
        ink: {
          DEFAULT: "#1C1410",
          2: "#6B5B52",
          3: "#9E8E85",
        },
        line: {
          DEFAULT: "#E5D9CF",
          2: "#D5C8BC",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(60,40,20,0.06), 0 16px 40px -20px rgba(60,40,20,0.20)",
        "card-sm": "0 1px 2px rgba(60,40,20,0.05), 0 8px 20px -14px rgba(60,40,20,0.18)",
        btn: "0 4px 0 0 #5E1E29",
        "btn-hover": "0 6px 0 0 #5E1E29",
      },
    },
  },
  plugins: [],
};

export default config;
