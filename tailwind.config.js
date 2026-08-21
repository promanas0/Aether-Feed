/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aether: {
          bg: "#0B132B",
          surface: "#1C2541",
          card: "#1E293B",
          border: "#334155",
          primary: "#2563EB",
          accent: "#3B82F6",
          light: "#FFFFFF",
          muted: "#94A3B8",
          subtle: "#64748B",
          dark: "#0F172A",
          hover: "#2A3756"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(37, 99, 235, 0.3)',
        'glow': '0 0 25px -5px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 35px -5px rgba(59, 130, 246, 0.6)',
      }
    },
  },
  plugins: [],
}
