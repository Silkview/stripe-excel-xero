/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
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
        sans: ['DM Sans', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
      },
    },
  },
  plugins: [],
};
