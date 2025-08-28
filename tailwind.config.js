/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./dev/**/*.html",
  ],
  // Keep preflight enabled; our PostCSS scoping confines it to :host
  theme: {
    extend: {},
  },
  plugins: [],
}; 