module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🟢 Primary (Shopify green style)
        primary: {
          light: "#6EE7B7",
          DEFAULT: "#16A34A",
          dark: "#166534",
        },

        // ⚪ Background & surface
        background: {
          DEFAULT: "#F9FAFB",
          subtle: "#F3F4F6",
          strong: "#E5E7EB",
        },

        // ⚫ Text hierarchy
        text: {
          primary: "#111827",
          secondary: "#6B7280",
          muted: "#9CA3AF",
        },

        // 🔘 Border & divider
        borderColor: {
          DEFAULT: "#E5E7EB",
          strong: "#D1D5DB",
        },

        // 🔵 Info / link
        info: {
          DEFAULT: "#2563EB",
          light: "#DBEAFE",
        },

        // 🟡 Warning
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },

        // 🔴 Danger
        danger: {
          DEFAULT: "#DC2626",
          light: "#FEE2E2",
        },

        // ⚫ Neutral (buat card, dll)
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          500: "#737373",
          700: "#404040",
          900: "#171717",
        },
      },
    },
  },
  plugins: [],
}