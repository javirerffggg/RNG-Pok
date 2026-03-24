import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'poke-dark':    '#0d0d1a',
        'poke-mid':     '#12122a',
        'poke-card':    '#1a1a3e',
        'poke-glass':   'rgba(255,255,255,0.05)',
        'poke-accent':  '#e94560',
        'poke-violet':  '#7c3aed',
        'poke-shiny':   '#ffd700',
        'poke-amber':   '#f59e0b',
        'poke-green':   '#4ade80',
        'poke-cyan':    '#22d3ee',
      },
      fontFamily: {
        sans:    ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'monospace'],
      },
      backgroundImage: {
        'aurora': 'radial-gradient(ellipse 80% 50% at 20% 40%, rgba(124,58,237,0.15) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 80% 70%, rgba(233,69,96,0.1) 0%, transparent 60%), radial-gradient(ellipse 100% 80% at 50% 0%, rgba(34,211,238,0.06) 0%, transparent 70%)',
        'glass-border': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.08) 100%)',
        'shiny-gradient': 'linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #ffd700 100%)',
        'accent-gradient': 'linear-gradient(135deg, #e94560 0%, #7c3aed 100%)',
        'btn-primary': 'linear-gradient(135deg, #e94560 0%, #c2185b 100%)',
      },
      boxShadow: {
        'glass':       '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'shiny':       '0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,215,0,0.15)',
        'shiny-lg':    '0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,215,0,0.25), 0 0 90px rgba(255,215,0,0.1)',
        'accent':      '0 0 20px rgba(233,69,96,0.4)',
        'violet':      '0 0 20px rgba(124,58,237,0.4)',
        'btn':         '0 4px 15px rgba(233,69,96,0.3)',
        'card':        '0 4px 24px rgba(0,0,0,0.3)',
      },
      animation: {
        'shiny-rotate':  'shiny-rotate 3s linear infinite',
        'shimmer':       'shimmer 1.5s ease-in-out infinite',
        'float':         'float 3s ease-in-out infinite',
        'glow-pulse':    'glow-pulse 2s ease-in-out infinite',
        'number-tick':   'number-tick 0.15s ease-out',
        'slide-up':      'slide-up 0.3s ease-out',
        'danger-pulse':  'danger-pulse 0.5s ease-in-out infinite',
      },
      keyframes: {
        'shiny-rotate': {
          '0%':   { backgroundPosition: '0% 50%' },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(255,215,0,0.3), 0 0 20px rgba(255,215,0,0.1)' },
          '50%':      { boxShadow: '0 0 25px rgba(255,215,0,0.7), 0 0 50px rgba(255,215,0,0.3), 0 0 75px rgba(255,215,0,0.1)' },
        },
        'number-tick': {
          '0%':   { transform: 'translateY(-4px)', opacity: '0.5' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'danger-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(233,69,96,0.5)', backgroundColor: 'rgba(127,29,29,0.8)' },
          '50%':      { boxShadow: '0 0 35px rgba(233,69,96,0.9)', backgroundColor: 'rgba(153,27,27,0.95)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
} satisfies Config
