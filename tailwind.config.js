/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nile: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#0879C9',
          600: '#1976D2',
          700: '#1565C0',
          800: '#0D47A1',
          900: '#0A3578',
        },
        mango: {
          50: '#FFF8E1',
          100: '#FFECB3',
          200: '#FFE082',
          300: '#FFD54F',
          400: '#FFCA28',
          500: '#FFC107',
          600: '#FFB300',
          700: '#FFA000',
          800: '#FF8F00',
          900: '#E67600',
        },
        clay: {
          50: '#FBE9E7',
          100: '#FFCCBC',
          200: '#FFAB91',
          300: '#FF8A65',
          400: '#FF7043',
          500: '#D84315',
          600: '#BF360C',
          700: '#A3300A',
          800: '#8A2808',
          900: '#6E1F06',
        },
        sand: {
          50: '#FBF7EE',
          100: '#F5F0E1',
          200: '#EDE5CC',
          300: '#E0D4A8',
          400: '#C9B68A',
          500: '#A89866',
        },
        mint: {
          400: '#26A69A',
          500: '#00897B',
          600: '#00796B',
        },
        berry: {
          400: '#EC407A',
          500: '#D81B60',
        },
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
        display: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 8px 24px -8px rgba(30, 136, 229, 0.25)',
        pop: '0 12px 32px -10px rgba(216, 67, 21, 0.35)',
        card: '0 4px 14px -4px rgba(13, 71, 161, 0.15)',
      },
      borderRadius: {
        blob: '2.5rem',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        wiggle: 'wiggle 0.6s ease-in-out infinite',
        bob: 'bob 1.8s ease-in-out infinite',
        pulseRing: 'pulseRing 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
      },
    },
  },
  plugins: [],
};
