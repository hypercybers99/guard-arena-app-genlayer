/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        arena: {
          bg: '#0B1120', // deep midnight navy
          surface: '#111827', // dark slate
          card: '#1E293B', // card surface
          cardHover: '#243247',
          border: '#334155', // crisp subtle border
          borderLight: '#475569',
          primary: '#2563EB', // vibrant blue
          primaryHover: '#1D4ED8',
          accent: '#38BDF8', // sky cyan
          breach: '#EF4444', // crimson red for breached
          held: '#10B981', // emerald green for held
          unconfirmed: '#F59E0B', // amber for unconfirmed breach
          flaky: '#8B5CF6', // purple for flaky
          text: '#F8FAFC',
          muted: '#94A3B8',
          subtle: '#64748B',
        }
      },
      screens: {
        'xs': '390px',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
