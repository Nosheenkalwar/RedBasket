/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // the colours from the RedBasket prototype
      colors: {
        cotton: '#EDEBDE',
        card: '#F7F5EC',
        tint: '#E3E0CF',
        line: '#D5D1BD',
        cherry: { DEFAULT: '#810100', dark: '#630102', soft: '#EFD9D3' },
        noir: '#1B1716',
        ink: { 2: '#5F5853', 3: '#8A837C' },
        ok: { DEFAULT: '#2E6B45', soft: '#DCE7D6' },
        warn: { DEFAULT: '#9A5A07', soft: '#F1DFB9' },
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
