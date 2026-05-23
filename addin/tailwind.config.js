/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0b0f1a',
          2: '#48506a',
          3: '#8f96ad',
        },
        rule: {
          DEFAULT: '#e2e6f0',
          2: '#f0f3fa',
        },
        navy: '#1a2547',
        accent: {
          DEFAULT: '#2563eb',
          light: '#eef4ff',
          hover: '#1d4ed8',
        },
        stripe: {
          DEFAULT: '#635bff',
          light: '#eeeeff',
          hover: '#4e47e5',
        },
        xero: {
          DEFAULT: '#06b3e8',
          dark: '#0499c9',
          light: '#e6f8fd',
        },
        success: {
          DEFAULT: '#16a34a',
          bg: '#f0fdf4',
          text: '#0a6644',
        },
        warn: {
          DEFAULT: '#d97706',
          bg: '#fffbeb',
          text: '#7c4a00',
        },
        surface: '#ffffff',
        bg: '#f4f6fb',
        border: '#e2e6f0',
        text: {
          DEFAULT: '#0b0f1a',
          2: '#48506a',
          3: '#8f96ad',
        },
      },
      fontFamily: {
        sans: ['Figtree', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '9px',
        sm: '6px',
        lg: '8px',
      },
    },
  },
  plugins: [],
};
