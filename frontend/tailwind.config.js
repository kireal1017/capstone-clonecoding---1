/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand:   '#3E6AE1',
        surface: '#F4F4F4',
        ink:     '#171A20',
        body:    '#393C41',
        muted:   '#5C5E62',
        hair:    '#EEEEEE',
        ph:      '#8E8E8E',
      },
      borderRadius: {
        btn:  '4px',
        card: '12px',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          '"Segoe UI"',
          'Roboto',
          '"Apple SD Gothic Neo"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

