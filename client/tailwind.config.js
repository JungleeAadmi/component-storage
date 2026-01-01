/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Varela Round"', 'sans-serif'],
      },
      colors: {
        // Pitch Black / OLED Theme
        dark: {
          900: '#000000', // True Black
          800: '#121212', // Material Dark Gray (Surface)
          700: '#27272a', // Borders
          600: '#3f3f46', // Inputs
        },
        primary: {
          500: '#2563eb', 
          600: '#1d4ed8', 
          700: '#1e40af', 
        },
        accent: {
          500: '#10b981', 
          600: '#dc2626', 
        }
      }
    },
  },
  plugins: [],
}