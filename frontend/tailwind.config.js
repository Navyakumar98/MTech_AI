/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF2FB",
          100: "#D9E1F3",
          200: "#B1C0E5",
          300: "#7F95CF",
          400: "#4C6CB8",
          500: "#2D4FA3",
          600: "#1F3F91",
          700: "#163D8F",
          800: "#112E6E",
          900: "#0B2050",
          950: "#071538",
        },
        brand: {
          DEFAULT: "#163D8F",
          accent: "#2563EB",
          accentDark: "#1D4ED8",
          accentSoft: "#E0EAFF",
        },
        ink: {
          900: "#0B1220",
          800: "#0F172A",
          700: "#1F2937",
          600: "#334155",
          500: "#475569",
          400: "#64748B",
          300: "#94A3B8",
          200: "#CBD5E1",
          100: "#E2E8F0",
          50: "#F1F5F9",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          subtle: "#F7F8FA",
          muted: "#F1F4F9",
        },
        success: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        warn: {
          50: "#FFFBEB",
          500: "#F59E0B",
          600: "#D97706",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)",
        soft: "0 4px 14px rgba(15, 23, 42, 0.06)",
        pop: "0 10px 30px -12px rgba(22, 61, 143, 0.25)",
      },
      borderRadius: {
        xl2: "16px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "SF Pro Display",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
