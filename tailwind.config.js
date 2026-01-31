/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enforce amber if needed, though 'colors' usually has it.
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        exo: ['"Exo 2"', 'sans-serif'],
        tech: ['"Share Tech Mono"', 'monospace'], // Fallback or add if missing
      },
    },
  },
  plugins: [],
}
