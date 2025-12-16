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
    red: {
      gradient: 'from-red-500 to-red-600',
      shadow: 'shadow-card-red',
      icon: 'text-red-100',
      bg: 'bg-gradient-red',
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

// Medical Appointments Color System
export const appointmentColors = {
  first_visit: {
    light: {
      bg: 'bg-blue-50',
      border: 'border-blue-500',
      text: 'text-blue-900',
      icon: 'text-blue-500',
    },
    dark: {
      bg: 'bg-blue-900/20',
      border: 'border-blue-500',
      text: 'text-blue-100',
      icon: 'text-blue-400',
    },
  },
  return: {
    light: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-900',
      icon: 'text-green-500',
    },
    dark: {
      bg: 'bg-green-900/20',
      border: 'border-green-500',
      text: 'text-green-100',
      icon: 'text-green-400',
    },
  },
  procedure: {
    light: {
      bg: 'bg-purple-50',
      border: 'border-purple-500',
      text: 'text-purple-900',
      icon: 'text-purple-500',
    },
    dark: {
      bg: 'bg-purple-900/20',
      border: 'border-purple-500',
      text: 'text-purple-100',
      icon: 'text-purple-400',
    },
  },
  urgent: {
    light: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: 'text-red-500',
    },
    dark: {
      bg: 'bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-100',
      icon: 'text-red-400',
    },
  },
  follow_up: {
    light: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-500',
      text: 'text-cyan-900',
      icon: 'text-cyan-500',
    },
    dark: {
      bg: 'bg-cyan-900/20',
      border: 'border-cyan-500',
      text: 'text-cyan-100',
      icon: 'text-cyan-400',
    },
  },
  exam: {
    light: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-500',
      text: 'text-yellow-900',
      icon: 'text-yellow-600',
    },
    dark: {
      bg: 'bg-yellow-900/20',
      border: 'border-yellow-500',
      text: 'text-yellow-100',
      icon: 'text-yellow-400',
    },
  },
} as const;

// Payment Status Colors
export const paymentStatusColors = {
  pending: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-500',
    border: 'border-yellow-500/20',
  },
  paid: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-500',
    border: 'border-green-500/20',
  },
  partial: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-500',
    border: 'border-orange-500/20',
  },
  cancelled: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  },
} as const;

// Appointment Status Colors
export const appointmentStatusColors = {
  scheduled: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
  },
  confirmed: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
  },
  in_progress: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
  },
  completed: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
  },
  cancelled: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
  },
  no_show: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
  },
} as const;

export type CardVariant = keyof typeof designTokens.cardVariants;
export type StatusType = keyof typeof designTokens.status;
