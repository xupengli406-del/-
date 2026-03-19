/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        'capsule': '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.08)',
      },
      colors: {
        brand: {
          DEFAULT: '#2B5AE8',
          light: '#4A7AFF',
          dark: '#1A3FB5',
          50: '#EEF2FE',
          100: '#D9E2FD',
          500: '#2B5AE8',
          600: '#1A3FB5',
        },
        apple: {
          text: '#1d1d1f',
          'text-secondary': '#86868b',
          'text-tertiary': '#aeaeb2',
          border: '#d2d2d7',
          'border-light': '#e8e8ed',
          bg: '#ffffff',
          'bg-secondary': '#f5f5f7',
          'bg-tertiary': '#fbfbfd',
        },
      },
    },
  },
  plugins: [],
}
