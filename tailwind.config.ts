import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0c',
          900: '#121215',
          800: '#1b1b20',
          700: '#26262d',
          600: '#3a3a44',
        },
        brand: {
          50: '#fff4ed',
          100: '#ffe6d5',
          200: '#fec9a3',
          300: '#fda76b',
          400: '#fb7f33',
          500: '#f4600f',
          600: '#e2470a',
          700: '#bb350c',
          800: '#952b11',
          900: '#792611',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.18)',
      },
      keyframes: {
        fadeUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
      },
      animation: {
        fadeUp: 'fadeUp 0.5s ease-out both',
        fadeIn: 'fadeIn 0.3s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
