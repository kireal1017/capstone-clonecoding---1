import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { notFound } from '../utils/errors.js';
import {
  findReportByShareToken,
  getSnapshotByReportId,
  listConfirmations,
} from '../db/repositories/reports.js';

const router = Router();

// PUBLIC: 공유 토큰으로 리포트 조회 (인증/이름 마스킹 없음, 조회 전용)
router.get('/:token', (req, res, next) => {
  try {
    const row = findReportByShareToken(req.params.token);
    if (!row) throw notFound('share link not found');
    sendOk(res, {
      report: {
        id: row.reportId,
        inspectionType: row.inspectionType,
        grade: row.grade,
        createdAt: row.createdAt,
        snapshot: getSnapshotByReportId(row.reportId),
        confirmations: listConfirmations(row.reportId),
      },
    });
  } catch (e) { next(e); }
});

export default router;
