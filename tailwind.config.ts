import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0a0a0f',
          secondary: '#13131a',
          tertiary: '#1a1a24',
        },
        primary: {
          DEFAULT: '#d4a574',
          dark: '#b8895f',
          light: '#e8c9a0',
        },
        accent: {
          fire: '#ff6b35',
          gold: '#f4a261',
          ember: '#e76f51',
        },
        fantasy: {
          purple: '#6a4c93',
          green: '#2d4a3e',
          blue: '#264653',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
        fantasy: ['var(--font-cinzel)'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'fire-glow': 'radial-gradient(circle, rgba(255,107,53,0.2) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};
export default config;
