import type { Config } from "tailwindcss";

const config: Config = {
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			fredoka: ['var(--font-fredoka)', 'sans-serif'],
  			quicksand: ['var(--font-quicksand)', 'sans-serif'],
  		},
  		fontWeight: {
  			light: '300',
  			normal: '400',
  			medium: '500',
  		},
  	}
  },
  plugins: [],
};
export default config;
