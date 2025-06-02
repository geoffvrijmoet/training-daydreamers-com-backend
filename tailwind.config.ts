import type { Config } from "tailwindcss";

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
  		colors: {
  			brand: {
  				// Primary brand colors from navigation
  				blue: {
  					50: '#eff6ff',   // bg-blue-50
  					100: '#dbeafe',  // hover:bg-blue-100
  					700: '#1d4ed8',  // text-blue-700
  				},
  				green: {
  					50: '#f0fdf4',   // bg-green-50
  					100: '#dcfce7',  // hover:bg-green-100
  					700: '#15803d',  // text-green-700
  				},
  				purple: {
  					50: '#faf5ff',   // bg-purple-50
  					100: '#f3e8ff',  // hover:bg-purple-100
  					700: '#7c3aed',  // text-purple-700
  				},
  				pink: {
  					50: '#fdf2f8',   // bg-pink-50
  					100: '#fce7f3',  // hover:bg-pink-100
  					700: '#be185d',  // text-pink-700
  				},
  				amber: {
  					50: '#fffbeb',   // bg-amber-50
  					100: '#fef3c7',  // hover:bg-amber-100
  					700: '#b45309',  // text-amber-700
  				},
  				orange: {
  					50: '#fff7ed',   // bg-orange-50
  					100: '#ffedd5',  // hover:bg-orange-100
  					700: '#c2410c',  // text-orange-700
  				},
  			},
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
