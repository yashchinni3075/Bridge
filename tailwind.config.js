/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C2434", // deep navy-charcoal, sidebar + headings
          soft: "#5B6478",
        },
        paper: {
          DEFAULT: "#F6F5F1", // warm off-white background
          raised: "#FFFFFF",
        },
        line: "#E4E2DC",
        coral: {
          DEFAULT: "#FF6B4A", // primary accent — CTAs, scores, brand mark
          soft: "#FFE4DB",
        },
        emerald: {
          DEFAULT: "#1F9D6B", // verified / success
          soft: "#DCF3E8",
        },
        amber: {
          DEFAULT: "#E8A33D", // pending / attention
          soft: "#FBEBD1",
        },
        rose: {
          DEFAULT: "#E14F4F", // error / gaps / unverified
          soft: "#FCE1E1",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
