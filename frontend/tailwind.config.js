/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["var(--ds-font-display)"],
        sans: ["var(--ds-font-sans)"],
        mono: ["var(--ds-font-mono)"],
      },
      colors: {
        ds: {
          void: "var(--ds-void)",
          surface: "var(--ds-surface)",
          elevated: "var(--ds-surface-elevated)",
          text: "var(--ds-text)",
          muted: "var(--ds-text-muted)",
          border: "var(--ds-border)",
          accent: "var(--ds-accent)",
          secondary: "var(--ds-accent-secondary)",
          ink: "var(--ds-accent-ink)",
          danger: "var(--ds-danger)",
        },
        border: "var(--ds-border)",
        input: "var(--ds-border-strong)",
        ring: "var(--ds-accent)",
        background: "var(--ds-void)",
        foreground: "var(--ds-text)",
        primary: {
          DEFAULT: "var(--ds-accent)",
          foreground: "var(--ds-accent-ink)",
        },
        secondary: {
          DEFAULT: "var(--ds-surface-elevated)",
          foreground: "var(--ds-text)",
        },
        destructive: {
          DEFAULT: "var(--ds-danger)",
          foreground: "#1a0308",
        },
        muted: {
          DEFAULT: "var(--ds-surface-elevated)",
          foreground: "var(--ds-text-muted)",
        },
        accent: {
          DEFAULT: "var(--ds-accent-secondary)",
          foreground: "#05070e",
        },
        card: {
          DEFAULT: "var(--ds-surface)",
          foreground: "var(--ds-text)",
        },
      },
      boxShadow: {
        hud: "0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        neon: "0 0 22px -4px color-mix(in srgb, var(--ds-accent) 55%, transparent)",
      },
      borderRadius: {
        hud: "var(--ds-radius-card)",
        control: "var(--ds-radius-control)",
      },
    },
  },
  plugins: [],
};
