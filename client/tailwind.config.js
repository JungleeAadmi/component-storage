/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Setting Varela Round as the default sans font
        sans: ['"Varela Round"', 'sans-serif'],
      },
      colors: {
        // Custom Dark Professional Theme
        dark: {
          900: '#0f172a', // Main background
          800: '#1e293b', // Card background
          700: '#334155', // Borders/Hover
        },
        primary: {
          500: '#3b82f6', // Bright Blue for actions
          600: '#2563eb', // Darker Blue for hover
        },
        accent: {
          500: '#10b981', // Emerald for success/safe
          600: '#ef4444', // Red for danger/delete
        }
      }
    },
  },
  plugins: [],
}