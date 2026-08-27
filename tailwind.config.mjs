/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060813', // deepest background
          900: '#0b0f1f', // card & panel surface
          850: '#0e1428', // elevated surface
          800: '#141c38', // active states & dropdowns
          700: '#1d274d', // lighter borders
          border: 'rgba(255, 255, 255, 0.08)',
          'border-subtle': 'rgba(255, 255, 255, 0.05)',
          'border-bright': 'rgba(255, 255, 255, 0.15)',
        },
        brand: {
          purple: '#8b5cf6',
          violet: '#6366f1',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          emerald: '#10b981',
          gold: '#f59e0b',
          silver: '#94a3b8',
          bronze: '#d97706',
        },
      },
      fontFamily: {
        sans: [
          'Poppins',
          'Instrument Sans',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        poppins: ['Poppins', 'sans-serif'],
        instrument: ['Instrument Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.45), 0 0 10px -2px rgba(139, 92, 246, 0.3)',
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.45), 0 0 10px -2px rgba(59, 130, 246, 0.3)',
        'glow-gold': '0 0 30px -5px rgba(245, 158, 11, 0.4), 0 0 12px -2px rgba(245, 158, 11, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 20px -4px rgba(16, 185, 129, 0.4)',
        'card-glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18) 0%, rgba(139, 92, 246, 0.08) 40%, transparent 70%)',
        'card-gradient': 'linear-gradient(180deg, rgba(16, 22, 44, 0.7) 0%, rgba(11, 15, 31, 0.8) 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(-1deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
