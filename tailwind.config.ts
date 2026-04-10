import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core palette
        canvas: "#F7F6F2",
        "canvas-subtle": "#EFEDE7",
        ink: "#18182B",
        "ink-muted": "#6B6B7E",
        "ink-faint": "#9B9BAE",
        border: "#E2E2D5",
        "border-strong": "#CACAB8",
        surface: "#FFFFFF",
        // Brand accent
        teal: {
          DEFAULT: "#1E7B7E",
          light: "#3D9FA3",
          pale: "#E8F4F5",
          dark: "#155B5E",
        },
        // Semantic
        approved: {
          DEFAULT: "#1A6B45",
          bg: "#EBF5F0",
          border: "#A8D5BE",
        },
        borderline: {
          DEFAULT: "#B07A10",
          bg: "#FDF6E8",
          border: "#F0CC7A",
        },
        rejected: {
          DEFAULT: "#8B1E2F",
          bg: "#F9ECED",
          border: "#E4A8B0",
        },
        // Admin navy sidebar
        navy: {
          DEFAULT: "#18182B",
          light: "#252540",
          muted: "#3D3D5C",
          border: "#2E2E4A",
          text: "#C8C8DC",
          "text-muted": "#8080A0",
        },
      },
      fontFamily: {
        display: ["DM Serif Display", "Georgia", "serif"],
        sans: ["Figtree", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(24, 24, 43, 0.06), 0 1px 2px -1px rgba(24, 24, 43, 0.04)",
        "card-hover": "0 4px 12px 0 rgba(24, 24, 43, 0.08), 0 2px 4px -1px rgba(24, 24, 43, 0.06)",
        panel: "0 0 0 1px rgba(24, 24, 43, 0.06), 0 2px 8px 0 rgba(24, 24, 43, 0.06)",
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-in": "slideIn 0.3s ease forwards",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
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

export default config;
