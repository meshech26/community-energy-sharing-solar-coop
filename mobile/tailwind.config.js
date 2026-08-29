/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.js',
    './components/**/*.{js,jsx}',
    './screens/**/*.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],

  presets: [require('nativewind/preset')],

  theme: {
    extend: {
      colors: {
        ink: '#16241C',
        surface: '#FBFAF6',
        muted: '#5B6B61',
        border: '#E4E1D6',
        danger: '#C0503A',

        primary: {
          DEFAULT: '#1F6F4B',
          dark: '#154F35',
          light: '#E7F2EC',
        },

        sun: {
          DEFAULT: '#F2A93B',
          light: '#FDF0DA',
        },

        sky: {
          DEFAULT: '#3B7EA1',
          light: '#E8F1F5',
        },
      },
    },
  },

  plugins: [],
};