/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        purple: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Dark-purple alias tokens for deep accent areas
        'dp': {
          50:  '#f5f0ff',
          100: '#ede0ff',
          200: '#d9bfff',
          300: '#be93ff',
          400: '#9c5eff',
          500: '#7c2fff',
          600: '#6610eb',
          700: '#520dc2',
          800: '#400f9b',
          900: '#290a6e',
          950: '#160540',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary':    '0 0 25px -5px rgba(147, 51, 234, 0.40)',
        'glow-purple':     '0 0 30px -5px rgba(147, 51, 234, 0.35)',
        'glow-dark':       '0 0 40px -8px rgba(88, 28, 135, 0.50)',
        'purple-soft':     '0 10px 30px -10px rgba(147, 51, 234, 0.14)',
        'purple-card':     '0 4px 24px -4px rgba(107, 33, 168, 0.18)',
        'purple-inset':    'inset 0 1px 0 rgba(192, 132, 252, 0.15)',
      },
      keyframes: {
        'purple-pulse': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(147,51,234,0.4)' },
          '50%': { opacity: '0.85', boxShadow: '0 0 0 8px rgba(147,51,234,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'purple-pulse': 'purple-pulse 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #4c1d95 0%, #7e22ce 50%, #a855f7 100%)',
        'purple-dark-gradient': 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #6b21a8 100%)',
        'purple-subtle': 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
        'purple-shimmer': 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.2) 50%, transparent 100%)',
      },
    },
  },
  plugins: [],
};
