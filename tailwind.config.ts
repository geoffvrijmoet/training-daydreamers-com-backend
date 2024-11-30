import type { Config } from "tailwindcss";

const config: Config = {
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
	'./src/**/*.{ts,tsx}',
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
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  // This ensures we have access to all default Tailwind colors including zinc
  presets: [require('tailwindcss/defaultConfig')],
};
export default config;
