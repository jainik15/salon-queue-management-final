/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7FF',
          100: '#E0EFFF',
          200: '#BAE0FD',
          300: '#7CC5FB',
          400: '#38A8F8',
          500: '#0E8CF1',
          600: '#026ED0',
          700: '#0358A8',
          800: '#074B8A',
          900: '#0C3F72',
          950: '#07274A',
        },
        navy: {
          deep: '#0A192F',
          mid: '#0F2547',
          light: '#1B3A6B',
        },
        ice: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-blue': 'pulse-blue 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        'pulse-blue': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37,99,235,0.25)' },
          '50%': { boxShadow: '0 0 35px rgba(37,99,235,0.6), 0 0 60px rgba(56,189,248,0.3)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-blue-card': 'linear-gradient(145deg, #FFFFFF 0%, #F0F7FF 100%)',
        'gradient-royal': 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 50%, #38BDF8 100%)',
        'gradient-navy': 'linear-gradient(135deg, #0A192F 0%, #0F2547 50%, #173663 100%)',
      },
    },
  },
  plugins: [],
}
