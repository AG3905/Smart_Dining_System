/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#14100C',
        surface: '#1F1712',
        'surface-light': '#2A201A',
        light: '#F3E9DD',
        ember: {
          DEFAULT: '#FF5A1F',
          hover: '#B23A0E',
        },
        rust: '#B23A0E',
        'amber-glow': '#FFB454',
        ivory: '#F3E9DD',
        muted: '#9C8A79',
        'free-green': '#6FCF7A',
        'occupied-red': '#E1462C',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

