import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
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
        sans: ["Outfit", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // Conta Azul Inspired Colors
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        // Gold for special highlights
        gold: {
          DEFAULT: "hsl(var(--gold))",
          foreground: "hsl(var(--gold-foreground))",
        },
        // Financial Colors
        positive: "hsl(var(--positive))",
        negative: "hsl(var(--negative))",
        neutral: "hsl(var(--neutral))",
        // Chart Colors
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
          "6": "hsl(var(--chart-6))",
        },
        // New Design System - Card Colors
        "card-red": {
          DEFAULT: "hsl(var(--card-red))",
          light: "hsl(var(--card-red-light))",
          foreground: "hsl(var(--card-red-foreground))",
        },
        "card-cyan": {
          DEFAULT: "hsl(var(--card-cyan))",
          light: "hsl(var(--card-cyan-light))",
          foreground: "hsl(var(--card-cyan-foreground))",
        },
        "card-yellow": {
          DEFAULT: "hsl(var(--card-yellow))",
          light: "hsl(var(--card-yellow-light))",
          foreground: "hsl(var(--card-yellow-foreground))",
        },
        "card-green": {
          DEFAULT: "hsl(var(--card-green))",
          light: "hsl(var(--card-green-light))",
          foreground: "hsl(var(--card-green-foreground))",
        },
      },
      backgroundImage: {
        'gradient-brand': 'var(--gradient-primary)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-accent': 'var(--gradient-accent)',
        'gradient-dark': 'var(--gradient-dark)',
        // New Design System - Gradient Backgrounds
        'gradient-purple': 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
        'gradient-yellow': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        'gradient-green': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      },
      boxShadow: {
        'brand': 'var(--shadow-brand)',
        'card': 'var(--shadow-card)',
        'glow': 'var(--shadow-glow)',
        // New Design System - Colored Card Shadows
        'card-purple': '0 8px 32px -8px rgba(139, 92, 246, 0.3)',
        'card-cyan': '0 8px 32px -8px rgba(6, 182, 212, 0.3)',
        'card-yellow': '0 8px 32px -8px rgba(245, 158, 11, 0.3)',
        'card-green': '0 8px 32px -8px rgba(16, 185, 129, 0.3)',
      },
      transitionProperty: {
        'smooth': 'var(--transition-smooth)',
        'brand': 'var(--transition-brand)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        // New Design System - Animations
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        // New Design System - Animations
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        shimmer: "shimmer 2s infinite",
        float: "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
