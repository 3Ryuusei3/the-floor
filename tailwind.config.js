/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        floor: {
          bg: "#080a12",
          surface: "#0f1423",
          card: "#161d31",
          border: "#232e4d",
          cyan: "#00f0ff",
          gold: "#ffd700",
          amber: "#ff9900",
          red: "#ff2a4b",
          purple: "#9d4edd",
          green: "#00ff88"
        }
      },
      fontFamily: {
        digital: ['"Orbitron"', '"Chakra Petch"', 'sans-serif'],
        display: ['"Montserrat"', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.4), inset 0 0 5px rgba(0, 240, 255, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 240, 255, 0.9), inset 0 0 15px rgba(0, 240, 255, 0.5)' }
        }
      }
    },
  },
  plugins: [],
}
