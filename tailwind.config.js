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
          coral: '#eb6a47',
          peach: '#f6c0af',
          navy: '#131d2b',
        },
        cyan: {
          50: '#fdede7',
          100: '#fbdcd0',
          200: '#f8c5b1',
          300: '#f4a98d',
          400: '#f08d6d',
          500: '#eb6a47',
          600: '#db5936',
          700: '#c54928',
          800: '#a33b1e',
          900: '#7f2d16',
        }
      }
    },
  },
  plugins: [],
};
