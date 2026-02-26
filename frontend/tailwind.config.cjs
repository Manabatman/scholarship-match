/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fbeff0",
          100: "#f4d6d9",
          200: "#e7a8ae",
          300: "#d97983",
          400: "#c54b58",
          500: "#7b1113", // UP maroon
          600: "#5f0d0f",
          700: "#46090b",
          800: "#2d0507",
          900: "#190304"
        },
        accent: {
          400: "#ffe38a",
          500: "#ffcc33", // golden yellow
          600: "#e0ad10"
        }
      }
    }
  },
  plugins: []
};
