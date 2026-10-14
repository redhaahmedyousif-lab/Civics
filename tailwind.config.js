/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./assets/js/**/*.js"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Cairo", "sans-serif"],
        body: ["Tajawal", "Cairo", "sans-serif"],
      },
      colors: {
        bh: { 50: "#fff1f2", 100: "#ffe1e3", 200: "#ffc7cc", 400: "#f3505f", 500: "#e3273a", 600: "#CE1126", 700: "#a90d1f", 800: "#8c1022", 900: "#5e0b17" },
      },
    },
  },
};
