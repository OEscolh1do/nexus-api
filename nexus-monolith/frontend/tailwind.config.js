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
          500: '#00D084',
          900: '#0B1215',
        }
      }
    },
  },
  plugins: [],
}
