/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f9f9f9',
          100: '#f0f0f0',
          200: '#e0e0e0',
          300: '#d0d0d0',
          400: '#a0a0a0',
          500: '#737373',
          600: '#404040',
          700: '#2a2a2a',
          800: '#1a1a1a',
          900: '#000000',
        },
        gray: {
          50: '#f9f9f9',
          100: '#f7f7f7',
          200: '#e0e0e0',
          300: '#d0d0d0',
          400: '#a0a0a0',
          500: '#737373',
          600: '#595959',
          700: '#404040',
          800: '#2a2a2a',
          900: '#1a1a1a',
        },
        accent: {
          light: '#f7f7f7',
          dark: '#1a1a1a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['60px', { lineHeight: '1em', letterSpacing: '-2.5%', fontWeight: '800' }],
        'xl-title': ['24px', { lineHeight: '1.5em', letterSpacing: '-2.5%', fontWeight: '600' }],
      },
      backdropBlur: {
        'xs': '2px',
        'sm': '4px',
        'md': '8px',
      }
    },
  },
  plugins: [],
}
