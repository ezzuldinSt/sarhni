import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        leather: {
          900: "#2C1A1D", // Deep Espresso (Background)
          800: "#3E2723", // Saddle Brown (Cards)
          700: "#4E342E", // Lighter Brown
          600: "#5D4037", // Warm Tan
          500: "#795548",
          accent: "#D7CCC8", // Creamy Latte (Text)
          pop: "#FFB74D",    // Burnt Orange/Gold (Buttons)
          popHover: "#F57C00"
        }
      },
      fontFamily: {
        sans: ['"Varela Round"', '"Tajawal"', 'sans-serif'],
      },
      backgroundImage: {
        'leather-texture': "url('/noise.png')",
      }
    },
  },
  plugins: [],
};
export default config;
