// OpenAI Chat Completions 클라이언트 (의존성 없이 global fetch 사용).
// DB/Express 의존 없음 — 순수하게 GPT 호출만 담당한다.

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

const MERGE_INSTRUCTION =
  '위 두 시스템 지침을 모두 따르고, 하나의 JSON 객체로 summary, actionCards, requiredDocuments, cautionPhrases, opinionDraft 키를 모두 포함해 응답하라. 반드시 JSON으로만 응답한다.';

/**
 * 여러 system 프롬프트 + merge 지침 + user content 를 한 번의 GPT 호출로 보낸다.
 * 파싱된 JSON 객체를 반환한다. 실패 시 throw (호출자가 fallback 처리).
 */
export async function callOpenAIChatJson({ systemPrompts, userContent, timeoutMs = 20000 }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('NO_API_KEY');

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const messages = [
    ...(systemPrompts ?? []).map((content) => ({ role: 'system', content })),
    { role: 'system', content: MERGE_INSTRUCTION },
    { role: 'user', content: userContent },
  ];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error('OPENAI_HTTP_' + res.status);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return JSON.parse(content);
  } finally {
    clearTimeout(timer);
  }
}
