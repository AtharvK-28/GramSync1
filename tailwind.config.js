/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./client/**/*.{html,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        bg:      '#0f1117',
        card:    '#181c26',
        lift:    '#1e2333',
        accent:  '#5b8fff',
        udhar:   '#ff5c5c',
        jama:    '#3dd68c',
        warn:    '#f5a623',
      },
    },
  },
  plugins: [],
};
