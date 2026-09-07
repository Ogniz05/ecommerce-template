/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',

        // Semantic neutrals, declared as real Tailwind colours so every utility
        // family works on them (text-, bg-, border-, ring-, divide-, placeholder-).
        ink: '#17171B',
        body: '#3E3E46',
        muted: '#6E6E7A',
        faint: '#A0A0AC',
        line: '#E5E5E9',
        'line-strong': '#D2D2D9',
        sunken: '#F6F6F7',

        // [CUSTOMIZE] Brand accent. Kept as a single hue on purpose — the 400/600
        // steps exist for hover and tint, not for building gradients out of.
        brand: {
          50: '#FDF1F5',
          100: '#FBE0EA',
          200: '#F5B9CE',
          300: '#EE8AAC',
          400: '#E44C80',
          500: '#D8125B',
          600: '#B10E4A',
          700: '#8E0B3B',
          800: '#6B082C',
          900: '#48051D',
          DEFAULT: '#D8125B',
        },

        // Neutral ramp, warm-leaning. `dark` is a legacy name kept so pages
        // outside the storefront keep rendering; the values are new.
        dark: {
          50: '#A0A0AC',
          100: '#8A8A96',
          200: '#6E6E7A',
          300: '#55555F',
          400: '#3E3E46',
          500: '#17171B',
          600: '#141418',
          700: '#111114',
          800: '#0E0E11',
          900: '#0A0A0C',
          DEFAULT: '#17171B',
        },
      },

      fontFamily: {
        display: ['Fraunces', 'Georgia', 'Times New Roman', 'serif'],
        heading: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        body: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },

      // These names are still referenced by admin/auth/loader screens. They now
      // resolve to flat fills so nothing renders a gradient anywhere.
      backgroundImage: {
        'gradient-brand': 'linear-gradient(#D8125B, #D8125B)',
        'gradient-brand-hover': 'linear-gradient(#B10E4A, #B10E4A)',
        'gradient-hero': 'linear-gradient(#17171B, #17171B)',
        'gradient-card': 'linear-gradient(180deg, transparent 55%, rgba(23,23,27,0.72) 100%)',
      },

      boxShadow: {
        1: '0 1px 2px rgba(23, 23, 27, 0.06)',
        2: '0 4px 14px rgba(23, 23, 27, 0.08)',
        3: '0 16px 40px rgba(23, 23, 27, 0.12)',
        // legacy aliases, de-coloured
        brand: '0 4px 14px rgba(23, 23, 27, 0.08)',
        'brand-lg': '0 16px 40px rgba(23, 23, 27, 0.12)',
        card: '0 1px 2px rgba(23, 23, 27, 0.06)',
        'card-hover': '0 4px 14px rgba(23, 23, 27, 0.08)',
      },

      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
        '3xl': '12px',
        '4xl': '12px',
        '5xl': '12px',
      },

      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },

      transitionDuration: {
        DEFAULT: '180ms',
      },

      screens: {
        xs: '375px',
        '3xl': '1920px',
      },

      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
