import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { requireUser } from '../middleware/auth.js';
import {
  listReportsForUser,
  getReportRow,
  getUserRoleOnUnit,
  hasUnitAccess,
  getSnapshotByReportId,
  getUnitWithBuilding,
  listConfirmations,
  listShareLinks,
  addConfirmation,
  createShareLink,
} from '../db/repositories/reports.js';

const router = Router();

// 수리 전 ↔ 수리 후 비교 예외 허용 집합
const REPAIR_TYPES = new Set(['repair_pre', 'repair_post']);

// 두 점검 유형이 비교 가능한지: 동일하거나, 둘 다 수리 전/후 집합에 속하면 허용.
function typesComparable(a, b) {
  if (a === b) return true;
  return REPAIR_TYPES.has(a) && REPAIR_TYPES.has(b);
}

function parsePositiveInt(value) {
  const n = Number.parseInt(value, 10);
  if (!Number.isInteger(n) || n <= 0 || String(n) !== String(value)) return null;
  return n;
}

function loadReportOr404(req) {
  const id = Number.parseInt(req.params.id, 10);
  const report = getReportRow(id);
  if (!report) throw notFound('report not found');
  return { id, report };
}

// 접근 가능한 리포트 목록
router.get('/', requireUser, (req, res, next) => {
  try {
    sendOk(res, { reports: listReportsForUser(req.user.id) });
  } catch (e) { next(e); }
});

// 리포트 비교 (반드시 '/:id'보다 먼저 등록)
router.get('/compare', requireUser, (req, res, next) => {
  try {
    const leftId = parsePositiveInt(req.query.leftId);
    const rightId = parsePositiveInt(req.query.rightId);
    if (leftId === null || rightId === null) {
      throw badRequest('leftId and rightId are required');
    }
    if (leftId === rightId) {
      throw badRequest('cannot compare a report with itself');
    }

    const left = getReportRow(leftId);
    if (!left) throw notFound('report not found: ' + leftId);
    const right = getReportRow(rightId);
    if (!right) throw notFound('report not found: ' + rightId);

    if (
      !hasUnitAccess(req.user.id, left.unitId) ||
      !hasUnitAccess(req.user.id, right.unitId)
    ) {
      throw forbidden('no access to one or both reports');
    }

    if (left.unitId !== right.unitId) {
      throw badRequest('reports must belong to the same unit', {
        leftUnitId: left.unitId,
        rightUnitId: right.unitId,
      });
    }

    if (!typesComparable(left.inspectionType, right.inspectionType)) {
      throw badRequest(
        'reports must have the same inspection type (repair_pre↔repair_post excepted)',
        { leftType: left.inspectionType, rightType: right.inspectionType },
      );
    }

    const repairExceptionApplied = left.inspectionType !== right.inspectionType;

    sendOk(res, {
      left: getSnapshotByReportId(left.id),
      right: getSnapshotByReportId(right.id),
      compareMeta: {
        unit: getUnitWithBuilding(left.unitId),
        leftReport: {
          id: left.id,
          inspectionType: left.inspectionType,
          grade: left.grade,
          createdAt: left.createdAt,
        },
        rightReport: {
          id: right.id,
          inspectionType: right.inspectionType,
          grade: right.grade,
          createdAt: right.createdAt,
        },
        repairExceptionApplied,
      },
      validation: {
        valid: true,
        sameUnit: true,
        sameType: left.inspectionType === right.inspectionType,
        repairExceptionApplied,
      },
    });
  } catch (e) { next(e); }
});

// 리포트 상세
router.get('/:id', requireUser, (req, res, next) => {
  try {
    const { id, report } = loadReportOr404(req);
    if (!hasUnitAccess(req.user.id, report.unitId)) {
      throw forbidden('no access to this report');
    }
    sendOk(res, {
      report: {
        id: report.id,
        inspectionType: report.inspectionType,
        grade: report.grade,
        createdAt: report.createdAt,
        roleInUnit: getUserRoleOnUnit(req.user.id, report.unitId),
        snapshot: getSnapshotByReportId(id),
        confirmations: listConfirmations(id),
        shareLinks: listShareLinks(id),
      },
    });
  } catch (e) { next(e); }
});

// 확인 완료 (owner/tenant만, 멱등)
router.post('/:id/confirm', requireUser, (req, res, next) => {
  try {
    const { id, report } = loadReportOr404(req);
    const role = getUserRoleOnUnit(req.user.id, report.unitId);
    if (role !== 'owner' && role !== 'tenant') {
      throw forbidden('only owner or tenant can confirm');
    }
    const { inserted } = addConfirmation(id, req.user.id, role);
    sendOk(res, { confirmed: true, role, alreadyConfirmed: !inserted });
  } catch (e) { next(e); }
});

// 공유 링크 생성 (접근 가능한 사용자 누구나)
router.post('/:id/share', requireUser, (req, res, next) => {
  try {
    const { id, report } = loadReportOr404(req);
    if (!hasUnitAccess(req.user.id, report.unitId)) {
      throw forbidden('no access to this report');
    }
    const { token } = createShareLink(id, req.user.id);
    sendOk(res, { token, sharePath: '/share/' + token }, 201);
  } catch (e) { next(e); }
});

export default router;
