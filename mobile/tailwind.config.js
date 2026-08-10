/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        background: '#0f172a',
        surface: '#1e293b',
        verified: '#22c55e',
        altered: '#eab308',
        fabricated: '#ef4444',
        muted: '#94a3b8',
        border: '#334155',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        arabic: ['Amiri_400Regular'],
        'arabic-bold': ['Amiri_700Bold'],
      },
    },
  },
  plugins: [],
};
