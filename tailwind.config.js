/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
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
          soft: "#F6F8FC"
        }
      },
      boxShadow: {
        soft: "0 12px 35px rgba(20, 31, 80, 0.08)",
        glow: "0 10px 35px rgba(91, 33, 244, 0.18)"
      }
    }
  },
  plugins: []
};