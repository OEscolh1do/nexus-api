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
          // Legacy keys mapped to New Strict Palette
          purple: "#64147D", // Primary (Roxo)
          green: "#05CD46", // Primary (Verde)
          lightPurple: "#874BBE", // Secondary (Roxo Claro)
          darkPurple: "#3C0A41", // Secondary (Roxo Escuro)
          deepPurple: "#1E002D", // Secondary (Roxo Profundo)
          lightGreen: "#73EB82", // Secondary (Verde Claro)
          darkGreen: "#146437", // Secondary (Verde Escuro)

          // Semantic aliases (optional)
          primary: "#64147D",
          secondary: "#05CD46",
          surface: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["Grammatika", "Inter", "sans-serif"],
        display: ["Grammatika", "Inter", "sans-serif"],
        mono: ["Consolas", "monaco", "monospace"],
      },
    },
  },
  plugins: [],
}
