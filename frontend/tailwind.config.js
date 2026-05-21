/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#000510',
          panel: '#010d1f',
          border: '#0a2a4a',
          cyan: '#00f0ff',
          green: '#00ff88',
          red: '#ff2244',
          orange: '#ff8800',
          purple: '#aa44ff',
          yellow: '#ffcc00',
          dim: '#0a1525',
        }
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
        sans: ['"Trebuchet MS"', 'Arial', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s linear infinite',
        'flicker': 'flicker 0.15s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: { '0%': { top: '0%' }, '100%': { top: '100%' } },
        flicker: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.85' } },
        glow: { '0%': { textShadow: '0 0 10px #00f0ff' }, '100%': { textShadow: '0 0 25px #00f0ff, 0 0 50px #00f0ff' } },
      }
    }
  },
  plugins: []
};
