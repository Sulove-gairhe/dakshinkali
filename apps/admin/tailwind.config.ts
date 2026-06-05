import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Dakshinkali Design Tokens ---
        primary: {
          DEFAULT: '#08335A',
          dark: '#062947',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F8FAFC',
          dark: '#0D467A',
          foreground: '#08335A',
        },
        accent: {
          DEFAULT: '#359ACF',
          foreground: '#FFFFFF',
        },
        highlight: {
          DEFAULT: '#5BB4E0',
          foreground: '#062947',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#08335A',
        },
        border: {
          DEFAULT: '#D7EBF2',
          dark: '#2585B8',
        },
        muted: {
          DEFAULT: '#7B9AAD',
          foreground: '#A9C1D1',
        },
        // shadcn/ui compatibility
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'Poppins', 'sans-serif'],
        body: ['var(--font-body)', 'Nunito', 'sans-serif'],
        sans: ['var(--font-body)', 'Nunito', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
        '2xl': '1rem',
        xl: '0.75rem',
        lg: '0.625rem',
        DEFAULT: '0.5rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(8, 51, 90, 0.08)',
        'card-hover': '0 6px 20px rgba(8, 51, 90, 0.12)',
        modal: '0 12px 40px rgba(8, 51, 90, 0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
