/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Single clean sans for the whole app (matches the reference UI).
        display: ['"Inter"', "system-ui", "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        // Primary blue (#2563EB) used everywhere via accent-*
        accent: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
        },
        // Dark navy sidebar
        sidebar: {
          DEFAULT: "#1E293B",
          dark: "#0F172A",
          hover: "#334155",
        },
        page: "#EFF6FF",      // app background
        card: "#F8FAFC",      // soft card background
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)",
      },
    },
  },
  plugins: [],
};
