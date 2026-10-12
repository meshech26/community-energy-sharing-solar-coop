/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './App.js',
    './components/**/*.{js,jsx}',
    './screens/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
    './navigation/**/*.{js,jsx}',
    './store/**/*.{js,jsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f6b4b',
          light: '#148a61',
          dark: '#0a4a34'
        }
      }
    },
  },
  plugins: [],
};