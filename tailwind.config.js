/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-green-600',
    'text-white',
    'rounded-lg',
    'p-4',
    'min-h-screen',
    'flex',
    'items-center',
    'justify-center',
  ],
  theme: {
    extend: {
      screens: {
        'tv': '1920px',
      },
    },
  },
  plugins: [],
}