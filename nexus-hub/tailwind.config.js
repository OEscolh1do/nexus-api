/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neonorte: {
          purple: '#6d28d9',
          deepPurple: '#4c1d95',
          green: '#10b981',
          teal: '#0d9488',
        }
      }
    },
  },
  plugins: [],
}
