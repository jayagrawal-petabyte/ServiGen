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
        }
      }
    },
  },
  plugins: [],
};
