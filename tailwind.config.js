/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // DAISY Brand Colors
        daisy: {
          50:  '#fdf8f4',
          100: '#faf0e8',
          200: '#f3dece',
          300: '#e8c5a8',
          400: '#d4a07a',
          500: '#c4855a',
          600: '#b06b42',
          700: '#935437',
          800: '#784531',
          900: '#623b2b',
          950: '#341d14',
        },
        rose: {
          gold: '#b76e79',
          light: '#e8b4b8',
          pale:  '#f9eced',
        },
        nude: {
          100: '#f5ede8',
          200: '#ead5cb',
          300: '#d4b5a8',
        },
        cream: '#faf7f2',
      },
      fontFamily: {
        // Premium serif for headings
        heading: ['Cormorant Garamond', 'Georgia', 'serif'],
        // Clean sans-serif for body
        body: ['Jost', 'sans-serif'],
        // Accent italic font
        accent: ['Playfair Display', 'serif'],
      },
      animation: {
        'fade-in':      'fadeIn 0.6s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
        'slide-down':   'slideDown 0.4s ease-out forwards',
        'scale-in':     'scaleIn 0.4s ease-out forwards',
        'shimmer':      'shimmer 2s infinite',
        'float':        'float 3s ease-in-out infinite',
        'marquee':      'marquee 25s linear infinite',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(30px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown:{ from: { opacity: '0', transform: 'translateY(-20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:  { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        shimmer:  { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        float:    { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        marquee:  { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
      },
      boxShadow: {
        'luxury': '0 4px 30px rgba(196, 133, 90, 0.15)',
        'card':   '0 2px 20px rgba(0,0,0,0.06)',
        'hover':  '0 8px 40px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
