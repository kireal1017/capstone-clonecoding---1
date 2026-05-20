import type { Config } from 'tailwindcss';

/**
 * 디자인 토큰 — design-reference.md "Serene Productivity"
 * (조용하고 미니멀: 무거운 색/그림자/라운드 지양, 1px 저대비 보더로 깊이 표현).
 *
 * Step 7에서 사용자 요청으로 선반영 (harness 원안은 Step 9 예정) —
 * 전역 "Tailwind 토큰 자리표시자" 항목 해소.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // 기본 팔레트
        charcoal: '#21201a', // primary (텍스트/강조)
        surface: '#f9f9f7', // 배경
        container: '#eeeeec',
        'on-surface': '#1a1c1b',
        outline: '#7a776e',
        error: '#ba1a1a',
        'soft-border': '#e5e7eb',
        'surface-container-low': '#f4f4f2',
        // 카테고리 5색 (data-model.md / design-reference.md)
        'category-meeting': '#7C3AED',
        'category-assignment': '#2563EB',
        'category-exam': '#DC2626',
        'category-personal': '#16A34A',
        'category-appointment': '#EA580C',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 기본
        card: '0.5rem', // 카드/모달
        pill: '9999px', // pill
      },
      maxWidth: {
        container: '800px', // 컨테이너 최대폭
      },
      spacing: {
        gutter: '16px', // 좌우 거터
      },
    },
  },
  plugins: [],
};

export default config;
