import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        primary: 'hsl(var(--primary))',
        'soft-pink': 'hsl(var(--soft-pink))',
        'text-dark': 'hsl(var(--text-dark))',
        'text-muted': 'hsl(var(--text-muted))',
        accent: 'hsl(var(--accent))',
        hospital: {
          blue: '#2563eb',
          pink: '#fbcfe8',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config

export default config