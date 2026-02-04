/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],

  safelist: [
    // Status badges
    "bg-green-500/10",
    "text-green-500",
    "bg-red-500/10",
    "text-red-500",

    // Buttons / actions
    "bg-blue-600/10",
    "bg-blue-500",
    "hover:bg-blue-500",
    "border-blue-500/20",
    "hover:border-blue-400/70",
    "hover:ring-blue-500/30",

    "hover:bg-red-500/10",
    "hover:border-red-400/80",
    "hover:ring-red-500/30",

    // Reset button
    "text-red-600",
    "hover:text-red-400",

    // Dropdown indicators
    "rotate-180",
    "text-blue-500",
  ],

  theme: {
    extend: {},
  },
  plugins: [],
};
