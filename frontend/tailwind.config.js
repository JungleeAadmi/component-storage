/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#fcfcf9',
          100: '#fffffd',
        },
        charcoal: {
          700: '#1f2121',
          800: '#262828',
        },
        teal: {
          300: '#32b8c6',
          400: '#2da6b2',
          500: '#21808d',
          600: '#1d7480',
          700: '#1a6873',
          800: '#2996a1',
        },
        slate: {
          500: '#626c71',
          900: '#13343b',
        },
      },
      fontFamily: {
        sans: ['FKGroteskNeue', 'Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
