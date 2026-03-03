/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        octopus: {
          pink: '#FF69B4',
          'pink-light': '#FF8DC7',
          'pink-dark': '#E0559E',
        },
      },
    },
  },
  plugins: [],
}
