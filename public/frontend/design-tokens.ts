/**
 * Design System Tokens
 * DashMed Pro - Design Único Híbrido
 * 
 * Baseado em 4 referências visuais combinadas
 */

export const designTokens = {
  // Spacing
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '1rem',      // 16px
    md: '1.5rem',    // 24px
    lg: '2rem',      // 32px
    xl: '3rem',      // 48px
    '2xl': '4rem',   // 64px
  },

  // Border Radius
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },

  // Typography
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Card variants
  cardVariants: {
    purple: {
      gradient: 'from-purple-500 to-purple-600',
      shadow: 'shadow-card-purple',
      icon: 'text-purple-100',
      bg: 'bg-gradient-purple',
    },
    cyan: {
      gradient: 'from-cyan-500 to-cyan-600',
      shadow: 'shadow-card-cyan',
      icon: 'text-cyan-100',
      bg: 'bg-gradient-cyan',
    },
    yellow: {
      gradient: 'from-yellow-500 to-yellow-600',
      shadow: 'shadow-card-yellow',
      icon: 'text-yellow-100',
      bg: 'bg-gradient-yellow',
    },
    green: {
      gradient: 'from-green-500 to-green-600',
      shadow: 'shadow-card-green',
      icon: 'text-green-100',
      bg: 'bg-gradient-green',
    },
  },

  // Chart colors
  chartColors: {
    primary: 'hsl(262, 83%, 58%)',    // Purple
    secondary: 'hsl(188, 94%, 43%)',  // Cyan
    tertiary: 'hsl(38, 92%, 50%)',    // Yellow
    quaternary: 'hsl(142, 76%, 36%)', // Green
    accent: 'hsl(217, 91%, 60%)',     // Blue
  },

  // Status colors
  status: {
    success: {
      bg: 'bg-green-500/10',
      text: 'text-green-500',
      border: 'border-green-500/20',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      text: 'text-yellow-500',
      border: 'border-yellow-500/20',
    },
    error: {
      bg: 'bg-red-500/10',
      text: 'text-red-500',
      border: 'border-red-500/20',
    },
    info: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-500',
      border: 'border-cyan-500/20',
    },
  },

  // Animations
  animations: {
    fadeIn: 'animate-fade-in',
    slideIn: 'animate-slide-in',
    float: 'animate-float',
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  },
};

// Ilustrações 3D URLs (placeholder - você pode substituir)
export const illustrations = {
  shopping: 'https://illustrations.popsy.co/amber/shopping-bags.svg',
  money: 'https://illustrations.popsy.co/amber/money.svg',
  people: 'https://illustrations.popsy.co/amber/people.svg',
  chart: 'https://illustrations.popsy.co/amber/analytics.svg',
  rocket: 'https://illustrations.popsy.co/amber/rocket-launch.svg',
  celebration: 'https://illustrations.popsy.co/amber/celebration.svg',
};

export type CardVariant = keyof typeof designTokens.cardVariants;
export type StatusType = keyof typeof designTokens.status;
