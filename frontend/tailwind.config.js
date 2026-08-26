/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C2434",
          soft: "#5B6478",
        },
        paper: {
          DEFAULT: "#F6F5F1",
          raised: "#FFFFFF",
        },
        line: "#E4E2DC",
        coral: {
          DEFAULT: "#FF6B4A",
          soft: "#FFE4DB",
        },
        emerald: {
          DEFAULT: "#1F9D6B",
          soft: "#DCF3E8",
        },
        amber: {
          DEFAULT: "#E8A33D",
          soft: "#FBEBD1",
        },
        rose: {
          DEFAULT: "#E14F4F",
          soft: "#FCE1E1",
        },
        founda: {
          navy: "#07164A",
          purple: "#9981db",
          violet: "#8B2CF5",
          blue: "#0879E8",
          cyan: "#08B9D9",
          teal: "#12C7B0",
          ink: "#0B173F",
          muted: "#64748B",
          line: "#E7EAF3",
          surface: "#FFFFFF",
          soft: "#F6F8FC",
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
      boxShadow: {
        soft: "0 12px 35px rgba(20, 31, 80, 0.08)",
        glow: "0 10px 35px rgba(91, 33, 244, 0.18)",
      },
    },
  },
  plugins: [],
};
