/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        cap: {
          navy:   '#12284C',
          blue:   '#0070AD',
          bright: '#00ADEF',
          light:  '#E8F4FD',
          muted:  '#6B7C93',
          bg:     '#F5F7FA',
        },
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(18,40,76,0.08), 0 4px 16px 0 rgba(18,40,76,0.06)',
        'card-hover': '0 4px 12px 0 rgba(18,40,76,0.12), 0 12px 32px 0 rgba(18,40,76,0.10)',
      },
    },
  },
  plugins: [],
};
