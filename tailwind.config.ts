import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'telink-violet': '#644ff7',
        'telink-violet-light': '#8c7cff',
        'telink-violet-dark': '#4a38d6',
        'status-booked': '#3b82f6',
        'status-completed': '#10b981',
        'status-no-show': '#f59e0b',
        'status-canceled': '#6b7280',
        'status-rescheduled': '#8b5cf6',
        // Glassmorphism colors
        glass: {
          border: 'rgba(139, 92, 246, 0.15)',
          bg: 'rgba(255, 255, 255, 0.7)',
          'bg-subtle': 'rgba(255, 255, 255, 0.5)',
          'bg-strong': 'rgba(255, 255, 255, 0.85)',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};

export default config;
