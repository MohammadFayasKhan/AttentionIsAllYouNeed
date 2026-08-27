/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#f5f5f7',
          ivory: '#fbfaf7',
          surface: '#ffffff',
          surfaceTranslucent: 'rgba(255, 255, 255, 0.78)',
          text: '#1d1d1f',
          secondary: '#6e6e73',
          tertiary: '#86868b',
          border: 'rgba(0, 0, 0, 0.08)',
          blue: '#0071e3',
          indigo: '#5e5ce6',
          purple: '#af52de',
          emerald: '#34c759',
          amber: '#ff9500',
          rose: '#ff3b30'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      boxShadow: {
        'apple-sm': '0 2px 8px rgba(0, 0, 0, 0.04)',
        'apple-md': '0 8px 24px rgba(0, 0, 0, 0.06)',
        'apple-lg': '0 16px 40px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
