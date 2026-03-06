module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-purple-500',
    'text-purple-600',
    'bg-purple-100',
    'border-purple-200',
    'hover:bg-purple-50',
    'animate-pulse'
  ]
}
