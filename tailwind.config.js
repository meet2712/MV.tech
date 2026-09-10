/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './*/index.html', './services/*/index.html', './js/*.js', './partials/*.html'],
  theme: {
    extend: {
      borderRadius: { '2xl': '8px', '3xl': '8px' },
      colors: {
        slate: {
          50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7', 300: '#d4d4d8',
          400: '#a1a1aa', 500: '#85858f', 600: '#64646e', 700: '#42424b',
          800: '#292930', 900: '#141419', 950: '#08090c'
        },
        brand: {
          blue: '#0024FF',
          cyan: '#00C2FF',
          green: '#31D0AA',
          ink: '#06101F',
          panel: '#0B1220'
        }
      },
      boxShadow: {
        glow: '0 24px 90px rgba(0, 36, 255, 0.28)',
        soft: '0 20px 60px rgba(2, 8, 23, 0.35)'
      },
      animation: {
        marquee: 'marquee 28s linear infinite',
        float: 'float 4s ease-in-out infinite',
        pulseLine: 'pulseLine 2.8s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
