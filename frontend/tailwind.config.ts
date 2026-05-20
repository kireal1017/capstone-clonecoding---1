import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Step 9: 디자인 토큰 (charcoal #21201a, surface #f9f9f7 등 + 카테고리 5색) 추가 예정
    },
  },
  plugins: [],
};

export default config;
