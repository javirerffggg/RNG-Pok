import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'poke-dark': '#1a1a2e',
        'poke-mid': '#16213e',
        'poke-card': '#0f3460',
        'poke-accent': '#e94560',
        'poke-shiny': '#ffd700',
        'poke-green': '#4ade80',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-shiny': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
} satisfies Config
