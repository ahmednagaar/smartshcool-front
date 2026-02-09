/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1e40af',
          light: '#3b82f6',
          dark: '#1e3a8a',
        },
        secondary: {
          DEFAULT: '#f97316',
          light: '#fb923c',
        },
        accent: {
          DEFAULT: '#10b981',
          light: '#34d399',
        },
        nafes: {
          gold: '#3b82f6', // Mapping gold to primary light based on styles.css comment
          dark: '#1A1A1A',
          cream: '#FFFFF0',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
