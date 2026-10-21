/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0221',
        primary: '#9333EA',
        secondary: '#FF4FCB',
        surface: 'rgba(255,255,255,0.05)',
        'surface-2': 'rgba(255,255,255,0.08)',
        border: 'rgba(255,255,255,0.1)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(147,51,234,0.25) 0%, transparent 70%)',
        'card-glow': 'linear-gradient(135deg, rgba(147,51,234,0.15), rgba(255,79,203,0.08))',
        'neon-border': 'linear-gradient(135deg, #9333EA, #FF4FCB)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        glow: { from: { boxShadow: '0 0 20px rgba(147,51,234,0.4)' }, to: { boxShadow: '0 0 40px rgba(255,79,203,0.6)' } },
      },
      boxShadow: {
        neon: '0 0 20px rgba(147,51,234,0.5), 0 0 40px rgba(147,51,234,0.2)',
        'neon-pink': '0 0 20px rgba(255,79,203,0.5)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
