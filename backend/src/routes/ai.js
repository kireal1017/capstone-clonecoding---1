import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { generateInspectionGuide } from '../services/aiGuide.js';
import { saveAiGuide, inspectionExists } from '../db/repositories/aiGuides.js';

const router = Router();

// POST /api/ai/inspection-guide
// body: { inspectionId?, ...context }
// AI 실패는 점검 흐름을 막지 않는다 — 항상 HTTP 200 (fallback 포함).
router.post('/inspection-guide', async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const { inspectionId, ...context } = body;

    const result = await generateInspectionGuide(context);

    // inspectionId 가 양의 정수이고 inspection 이 존재하면 저장한다.
    // 저장 실패는 응답을 막지 않는다.
    let saved = false;
    let aiGuideId;
    const inspIdInt = Number.parseInt(inspectionId, 10);
    if (Number.isInteger(inspIdInt) && inspIdInt > 0) {
      try {
        if (inspectionExists(inspIdInt)) {
          aiGuideId = saveAiGuide(inspIdInt, result.guide);
          saved = true;
        }
      } catch {
        saved = false;
      }
    }

    sendOk(res, {
      guide: result.guide,
      fallback: result.fallback,
      filtered: result.filtered,
      saved,
      ...(aiGuideId !== undefined ? { aiGuideId } : {}),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
