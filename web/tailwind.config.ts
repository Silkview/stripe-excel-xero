import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B0F1A',
          2: '#48506A',
          3: '#8F96AD',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
          light: '#EEF4FF',
        },
        navy: {
          DEFAULT: '#1A2547',
          2: '#232E58',
        },
        green: {
          DEFAULT: '#16A34A',
          light: '#F0FDF4',
        },
        amber: {
          DEFAULT: '#D97706',
          light: '#FFFBEB',
        },
        red: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        rule: '#E2E6F0',
        stripe: {
          DEFAULT: '#635bff',
          light: '#EEEEFF',
          hover: '#4e47e5',
        },
        xero: {
          DEFAULT: '#13B5EA',
          dark: '#0099bb',
          light: '#E0F6FB',
          text: '#007a99',
        },
        teal: '#0D9488',
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
        bg: '#F4F6FB',
        border: '#E2E6F0',
        text: {
          DEFAULT: '#0B0F1A',
          2: '#48506A',
          3: '#8F96AD',
        },
      },
      fontFamily: {
        sans: ['var(--font-figtree)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        lg: '14px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        lift: '0 8px 24px rgba(37,99,235,0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
