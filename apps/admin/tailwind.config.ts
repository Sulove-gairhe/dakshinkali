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
        // --- YourStore Design Tokens ---
        primary: {
          DEFAULT: '#3A5A40',
          dark: '#5C8A63',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#FAF3E0',
          dark: '#1C1A17',
          foreground: '#2B2B2B',
        },
        accent: {
          DEFAULT: '#E76F51',
          foreground: '#FFFFFF',
        },
        highlight: {
          DEFAULT: '#F4A261',
          foreground: '#2B2B2B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#242018',
        },
        border: {
          DEFAULT: '#E5D9C3',
          dark: '#2E2B26',
        },
        muted: {
          DEFAULT: '#6B7280',
          foreground: '#9CA3AF',
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
        card: '0 2px 12px rgba(58, 90, 64, 0.08)',
        'card-hover': '0 8px 24px rgba(58, 90, 64, 0.15)',
        modal: '0 20px 60px rgba(0, 0, 0, 0.15)',
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
