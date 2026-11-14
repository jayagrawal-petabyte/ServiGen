/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          canvas: '#FFF9F5',
          peach: '#F4A58A',
          coral: '#F7C4B3',
          terracotta: '#C96F55',
          navy: '#263B5E',
          text: '#332B28',
          card: '#FFFFFF',
        },
        cyan: {
          50: '#FFF9F5',
          100: '#FDEEE7',
          200: '#F7C4B3',
          300: '#F4A58A',
          400: '#E08569',
          500: '#C96F55',
          600: '#B85E44',
          700: '#A34E37',
          800: '#8A3E2A',
          900: '#6E2E1E',
        }
      }
    },
  },
  plugins: [],
};
