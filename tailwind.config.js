/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // AceTalks brand palette
        coral: {
          DEFAULT: "#E8673B",
          light: "#FEE9E0",
          dark: "#993C1D",
        },
        teal: {
          DEFAULT: "#0F6E56",
          light: "#D8EDE6",
          dark: "#085041",
        },
        gold: {
          DEFAULT: "#F2A930",
          light: "#FEF3DC",
        },
        cream: "#FBF8F4",
        charcoal: "#2C2925",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
}
