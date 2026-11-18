import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", md: "1.5rem", lg: "2rem" }, screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF6A00",
          50: "#FFF4EC",
          100: "#FFE5D0",
          200: "#FFC79E",
          500: "#FF6A00",
          600: "#E55F00",
          700: "#B84B00",
        },
        ink: { DEFAULT: "#111820", 800: "#18222d", 700: "#223040", 600: "#3a4756", 500: "#5b6877", 400: "#8793a1" },
        mist: "#F4F5F7",
      },
      fontFamily: {
        sans: ["var(--font-latin)", "Inter Variable", "Cairo Variable", "system-ui", "sans-serif"],
        arabic: ["Cairo Variable", "Tahoma", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,24,32,.05), 0 8px 24px -12px rgba(17,24,32,.18)",
        lift: "0 2px 4px rgba(17,24,32,.06), 0 18px 40px -18px rgba(17,24,32,.35)",
        glow: "0 10px 30px -10px rgba(255,106,0,.55)",
      },
      keyframes: {
        "fade-up": { "0%": { opacity: "0", transform: "translateY(14px)" }, "100%": { opacity: "1", transform: "none" } },
      },
      animation: { "fade-up": "fade-up .6s ease-out both" },
    },
  },
  plugins: [],
};
export default config;
