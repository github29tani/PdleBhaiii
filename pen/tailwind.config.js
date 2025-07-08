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
        primary: {
          DEFAULT: '#000000',
          light: '#333333',
          dark: '#000000',
        },
        secondary: {
          DEFAULT: '#ffffff',
          light: '#f5f5f5',
          dark: '#e0e0e0',
        },
      },
    },
  },
  plugins: [],
  corePlugins: {
    // Disable the container plugin as it's not needed for React Native
    container: false,
  },
  important: true, // Make Tailwind classes more specific to avoid style conflicts
}

