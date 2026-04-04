/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'flip-in':   'flipIn 0.4s ease-out',
        'flip-out':  'flipOut 0.4s ease-in',
        'slide-up':  'slideUp 0.3s ease-out',
        'fade-in':   'fadeIn 0.3s ease-out',
      },
      keyframes: {
        flipIn: {
          '0%':   { transform: 'rotateY(90deg)', opacity: 0 },
          '100%': { transform: 'rotateY(0deg)',  opacity: 1 },
        },
        flipOut: {
          '0%':   { transform: 'rotateY(0deg)',  opacity: 1 },
          '100%': { transform: 'rotateY(90deg)', opacity: 0 },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: 0 },
          '100%': { transform: 'translateY(0)',     opacity: 1 },
        },
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
