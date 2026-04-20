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
          navy:    '#1B3A5C',  // main text, headings
          green:   '#2D6A4F',  // primary buttons, accents
          teal:    '#2E86AB',  // secondary buttons, icons
          slate:   '#4A6080',  // subtitles, labels
          light:   '#F0F7F4',  // background tints
          border:  '#D1E0D8',  // borders, dividers
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}