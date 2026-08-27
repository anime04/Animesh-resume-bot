/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base': '#1E1E1C',
        'bg-base': '#1E1E1C',
        'surface': '#262624',
        'bg-surface': '#262624',
        'surface-2': '#2D2C2A',
        'bg-surface-2': '#2D2C2A',
        'border-subtle': '#3A3936',
        'border-border-subtle': '#3A3936',
        'primary': '#F5F4EF',
        'text-primary': '#F5F4EF',
        'muted': '#9C9A94',
        'text-muted': '#9C9A94',
        'accent': {
          DEFAULT: '#CC785C',
          hover: '#B86A50',
        },
        'error': '#D97757',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      lineHeight: {
        chat: '1.65',
      },
      maxWidth: {
        'panel': '720px',
      }
    },
  },
  plugins: [],
}
