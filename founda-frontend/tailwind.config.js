/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        founda: {
          purple: "#5B21F4",
          "purple-light": "#7C4DFF",
          blue: "#0879E8",
          "blue-light": "#3DA0FF",
          teal: "#12C7B0",
          "teal-light": "#4DDDC7",
          ink: "#0F1226",
          navy: "#0B1220",
          line: "#E6E8F3",
          surface: "#F8F9FC",
          muted: "#94A3B8",
        },
      },
      boxShadow: {
        glow: "0 20px 45px -20px rgba(91, 33, 244, 0.45)",
        "glow-sm": "0 8px 20px -8px rgba(91, 33, 244, 0.3)",
        card: "0 1px 3px rgba(15, 18, 38, 0.04), 0 4px 12px rgba(15, 18, 38, 0.03)",
        "card-hover": "0 4px 12px rgba(15, 18, 38, 0.06), 0 8px 24px rgba(15, 18, 38, 0.05)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-8px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
