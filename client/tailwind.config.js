/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf4ee',
          100: '#fae4d0',
          200: '#f5c7a1',
          300: '#efa16b',
          400: '#e87535',
          500: '#e35918',
          600: '#d4400e',
          700: '#b02d0f',
          800: '#8d2514',
          900: '#722114',
        },
        dark: '#0f0d0b',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
