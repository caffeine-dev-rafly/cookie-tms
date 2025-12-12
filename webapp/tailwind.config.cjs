/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Quicksand", "sans-serif"],
      },
      colors: {
        matcha: {
          50: "#F7F9F7",
          100: "#E8EFE9",
          200: "#D1E0D3",
          300: "#AECBB2",
          400: "#8FB496",
          500: "#6A9C78",
          600: "#527D63",
          700: "#3D5E4A",
          800: "#2A4234",
          900: "#18261E",
        },
      },
      boxShadow: {
        art: "6px 6px 0px 0px rgba(106, 156, 120, 0.2)",
        card: "0 2px 10px -2px rgba(106, 156, 120, 0.1)",
      },
    },
  },
  plugins: [],
};
