/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // IMPORTANTE: Ativa o modo manual via classe
  theme: {
    extend: {
      colors: {
        neo: {
          // Mapeia para as variáveis do CSS
          'bg-main': 'var(--bg-main)',
          'surface-1': 'var(--bg-surface-1)',
          'surface-2': 'var(--bg-surface-2)',
          
          'text-primary': 'var(--text-primary)',
          'text-sec': 'var(--text-secondary)',
          'white': 'var(--text-primary)', // Alias para facilitar compatibilidade
          
          'green-main': 'var(--accent-green)',
          'purple-main': 'var(--accent-purple)',
          'purple-light': 'var(--accent-purple-light)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Ou a fonte que você estiver usando
      }
    },
  },
  plugins: [],
}