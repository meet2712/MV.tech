/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './*/index.html', './js/*.js'],
  theme: {
    extend: {
      colors: {
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
