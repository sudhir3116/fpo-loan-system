/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        danger: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
      }
    },
  },
  plugins: [],
}
