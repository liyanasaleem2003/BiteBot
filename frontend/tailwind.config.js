/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // This includes all your components and pages
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FFC107", // Example yellow
        background: "#121212", // Dark background
        foreground: "#FFFFFF", // Light text
        "muted-foreground": "#A0A0A0", // Muted text
      },
    },
  },
  plugins: [],
};
