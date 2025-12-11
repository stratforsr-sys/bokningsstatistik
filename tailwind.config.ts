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
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
