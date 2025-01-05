import type { Config } from "tailwindcss";

/* eslint-disable @typescript-eslint/no-var-requires, no-restricted-syntax */
const config = {
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
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    require('@tailwindcss/forms'),
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    require('@tailwindcss/typography'),
  ],
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  presets: [require('tailwindcss/defaultConfig')],
} satisfies Config;

export default config;
