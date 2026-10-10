/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        atlas: {
          bg: 'rgb(var(--color-bg-primary))',
          'bg-secondary': 'rgb(var(--color-bg-secondary))',
          'bg-tertiary': 'rgb(var(--color-bg-tertiary))',
          border: 'rgb(var(--color-border))',
          text: 'rgb(var(--color-text-primary))',
          'text-secondary': 'rgb(var(--color-text-secondary))',
          accent: 'rgb(var(--color-accent))',
          emerald: 'rgb(var(--color-emerald))',
          amber: 'rgb(var(--color-amber))',
          red: 'rgb(var(--color-red))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'pulse-warn': 'pulse-warn 2s ease-in-out infinite',
        'pulse-critical': 'pulse-critical 1.5s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
