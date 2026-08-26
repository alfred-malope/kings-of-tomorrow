/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,ts,js}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#030712',
          900: '#071426',
          800: '#0c1e36',
          700: '#102844',
          600: '#163354',
        },
        blue: {
          DEFAULT: '#00AEEF',
          400: '#33BFF2',
          500: '#00AEEF',
          600: '#0090C7',
          700: '#00729E',
        },
        gold: {
          DEFAULT: '#F4B942',
          400: '#F7C961',
          500: '#F4B942',
          600: '#D9A236',
        },
        silver: {
          DEFAULT: '#C9D0D8',
          200: '#DDE3E8',
          400: '#C9D0D8',
          600: '#A5AFBA',
        },
      },
      fontFamily: {
        display: ['Oswald', 'Arial Narrow', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.7s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.7s ease-out forwards',
        'slow-zoom': 'slowZoom 20s ease-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeInUp: { from: { opacity: '0', transform: 'translateY(30px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeInDown: { from: { opacity: '0', transform: 'translateY(-30px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slowZoom: { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.08)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        pulseGlow: { '0%, 100%': { opacity: '0.3' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
