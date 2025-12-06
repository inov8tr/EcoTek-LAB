import type { Config } from "tailwindcss";
import { colors, spacing, typography, border, shadow } from "./brand-config";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px",
      },
    },
    extend: {
      colors: {
        ...colors,
        "text-main": "var(--color-text-main)",
        "text-heading": "var(--color-text-heading)",
        "text-link": "var(--color-text-link)",
        "bg-alt": "var(--color-bg-alt)",
        "border-subtle": "var(--color-border-subtle)",
        card: {
          light: "var(--color-card-light)",
        },
        "accent-sustainability": "var(--color-accent-sustainability)",
        "accent-cost": "var(--color-accent-cost)",
        "accent-durability": "var(--color-accent-durability)",
        "icon-bg": "var(--color-icon-bg)",
      },
      fontSize: {
        base: typography.base,
      },
      zIndex: {
        100: "100",
        max: "9999",
      },
      transitionProperty: {
        menu: "opacity, transform",
      },
      spacing: {
        ...spacing,
      },
      borderColor: {
        ...border,
      },
      boxShadow: {
        ...shadow,
      },
      dropShadow: {
        glow: "0 25px 55px rgba(15, 23, 42, 0.15)",
      },
      backgroundImage: {
        "ocean-noise":
          "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 0%, rgba(148, 163, 184, 0.25), transparent 45%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
