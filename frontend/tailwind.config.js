/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta principal — blanco + verde (accesible, alto contraste)
        primary:   { DEFAULT: '#16a34a', light: '#22c55e', dark: '#15803d' },
        surface:   '#ffffff',
        background:'#f9fafb',
        border:    '#e5e7eb',
        text:      { DEFAULT: '#111827', muted: '#4b5563', light: '#6b7280' },
        success:   '#16a34a',
        warning:   '#d97706',
        error:     '#dc2626',
        info:      '#2563eb',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        lg:   '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};
