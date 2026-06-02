// AI 점검 도우미 생성 서비스.
// 두 system 프롬프트를 한 번의 GPT 호출로 합쳐 사용하고,
// 응답을 정규화 + 금지 표현 필터링한다. 실패는 graceful fallback.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callOpenAIChatJson } from './aiClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', '..', 'prompts');

// 프롬프트 파일은 모듈 로드 시 한 번만 읽는다.
const INSPECTION_GUIDE_PROMPT = fs.readFileSync(
  path.join(PROMPTS_DIR, 'inspection-guide.system.md'),
  'utf8',
);
const OPINION_DRAFT_PROMPT = fs.readFileSync(
  path.join(PROMPTS_DIR, 'opinion-draft.system.md'),
  'utf8',
);

// 도메인 정책상 AI 응답에 금지된 표현 (case-sensitive 부분 문자열).
export const BANNED_PHRASES = [
  '임차인 책임',
  '임대인 책임',
  '고의',
  '과실 확정',
  '과실이 확정',
  '보증금 공제',
  '보증금에서 공제',
  '소송에서 유리',
  '판례상 확정',
];

const REPLACEMENT = '추가 확인 필요';

function cleanString(value, state) {
  if (typeof value !== 'string') return value;
  let out = value;
  for (const phrase of BANNED_PHRASES) {
    if (out.includes(phrase)) {
      out = out.split(phrase).join(REPLACEMENT);
      state.filtered = true;
    }
  }
  return out;
}

/**
 * 모든 문자열 값을 순회하며 금지 표현을 치환한다.
 * @returns {{ guide: object, filtered: boolean }}
 */
export function sanitizeGuide(guide) {
  const state = { filtered: false };
  const src = guide ?? {};

  const cleaned = {
    summary: cleanString(src.summary, state),
    actionCards: Array.isArray(src.actionCards)
      ? src.actionCards.map((card) => {
          if (!card || typeof card !== 'object') return card;
          return {
            ...card,
            type: card.type,
            title: cleanString(card.title, state),
            description: cleanString(card.description, state),
            buttonLabel: cleanString(card.buttonLabel, state),
          };
        })
      : src.actionCards,
    requiredDocuments: Array.isArray(src.requiredDocuments)
      ? src.requiredDocuments.map((d) => cleanString(d, state))
      : src.requiredDocuments,
    cautionPhrases: Array.isArray(src.cautionPhrases)
      ? src.cautionPhrases.map((c) => cleanString(c, state))
      : src.cautionPhrases,
    opinionDraft: cleanString(src.opinionDraft, state),
  };

  return { guide: cleaned, filtered: state.filtered };
}

/**
 * 5개 키가 모두 올바른 타입으로 존재하도록 보장한다.
 */
export function normalizeShape(obj) {
  const src = obj ?? {};
  return {
    summary: typeof src.summary === 'string' ? src.summary : '',
    actionCards: Array.isArray(src.actionCards) ? src.actionCards : [],
    requiredDocuments: Array.isArray(src.requiredDocuments) ? src.requiredDocuments : [],
    cautionPhrases: Array.isArray(src.cautionPhrases) ? src.cautionPhrases : [],
    opinionDraft: typeof src.opinionDraft === 'string' ? src.opinionDraft : '',
  };
}

// 자동 생성 실패 시 반환되는 안전한 기본 가이드.
export const FALLBACK_GUIDE = {
  summary:
    '자동 생성을 사용할 수 없어 기본 안내를 제공합니다. 수동으로 점검 내용을 작성하세요.',
  actionCards: [
    {
      type: 'photo',
      title: '현장 사진 촬영',
      description: '점검 대상의 전체와 문제 부위를 촬영해 기록으로 남기세요.',
      buttonLabel: '사진 촬영',
    },
    {
      type: 'check',
      title: '추가 확인',
      description: '현장 상태를 직접 확인하고 점검 항목을 수동으로 작성하세요.',
      buttonLabel: '추가 확인',
    },
  ],
  requiredDocuments: [],
  cautionPhrases: ['책임 소재를 단정하지 말고 중립적 표현을 사용하세요.'],
  opinionDraft: '',
};

/**
 * 점검 컨텍스트로 AI 가이드를 생성한다. 절대 throw 하지 않는다(graceful).
 * @returns {{ guide: object, fallback: boolean, filtered: boolean, error?: string }}
 */
export async function generateInspectionGuide(contextObj) {
  const userContent =
    '다음은 점검 컨텍스트입니다. 이 정보를 바탕으로 점검 도우미 가이드를 생성하세요.\n' +
    JSON.stringify(contextObj ?? {}, null, 2);

  try {
    const raw = await callOpenAIChatJson({
      systemPrompts: [INSPECTION_GUIDE_PROMPT, OPINION_DRAFT_PROMPT],
      userContent,
    });
    const shaped = normalizeShape(raw);
    const { guide, filtered } = sanitizeGuide(shaped);
    return { guide, fallback: false, filtered };
  } catch (err) {
    return { guide: FALLBACK_GUIDE, fallback: true, filtered: false, error: err.message };
  }
}
