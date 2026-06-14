/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // [CUSTOMIZE] Change these colors if needed - currently using brand palette (#D8125B + #2C2E39)
      colors: {
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        brand: {
          50: '#fef0f5',
          100: '#fde0eb',
          200: '#fbb4cc',
          300: '#f882a8',
          400: '#f44f83',
          500: '#D8125B',
          600: '#c00f52',
          700: '#a00d44',
          800: '#800a37',
          900: '#600829',
          DEFAULT: '#D8125B',
        },
        dark: {
          50: '#8a8c96',
          100: '#6a6c76',
          200: '#555765',
          300: '#434553',
          400: '#363843',
          500: '#2C2E39',
          600: '#252731',
          700: '#1e2028',
          800: '#16181f',
          900: '#0e1016',
          DEFAULT: '#2C2E39',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['"Outfit"', '"DM Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #D8125B 0%, #2C2E39 100%)',
        'gradient-brand-hover': 'linear-gradient(135deg, #c00f52 0%, #1e2028 100%)',
        'gradient-hero': 'linear-gradient(135deg, rgba(216,18,91,0.9) 0%, rgba(44,46,57,0.95) 100%)',
        'gradient-card': 'linear-gradient(180deg, transparent 60%, rgba(44,46,57,0.9) 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'brand': '0 4px 24px rgba(216, 18, 91, 0.35)',
        'brand-lg': '0 8px 40px rgba(216, 18, 91, 0.4)',
        'card': '0 4px 16px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.12)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.15)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.1)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-brand': 'pulseBrand 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s ease infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(216, 18, 91, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(216, 18, 91, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseBrand: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
        '68': '17rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      screens: {
        'xs': '375px',
        '3xl': '1920px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      }
    },
  },
  plugins: [],
};
