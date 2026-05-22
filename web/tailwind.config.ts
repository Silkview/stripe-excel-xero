import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        stripe: {
          DEFAULT: '#635bff',
          light: '#eef0ff',
          hover: '#4e47e5',
        },
        xero: {
          DEFAULT: '#00b4d8',
          dark: '#0099bb',
          light: '#e0f7fc',
          text: '#007a99',
        },
        success: {
          DEFAULT: '#12a05c',
          bg: '#e8f8f1',
          text: '#0a7a44',
        },
        warn: {
          DEFAULT: '#e07b39',
          bg: '#fdf0e7',
          text: '#b5601e',
        },
        surface: '#ffffff',
        bg: '#f5f6fa',
        border: '#e8eaf0',
        text: {
          DEFAULT: '#0d0f12',
          2: '#5a6072',
          3: '#9aa0b0',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(13, 15, 18, 0.06), 0 8px 24px rgba(13, 15, 18, 0.04)',
        lift: '0 4px 20px rgba(99, 91, 255, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
