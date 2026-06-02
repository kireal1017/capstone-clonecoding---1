import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { badRequest, forbidden, notFound, conflict, validationError } from '../utils/errors.js';
import { requireUser } from '../middleware/auth.js';
import { resolveFlow } from '../services/inspectionFlow.js';
import { computeGrade } from '../services/grading.js';
import { buildSnapshot } from '../services/reportSnapshot.js';
import {
  findInspectionById,
  listInspectionsForContractor,
  hasContractorPermissionOnUnit,
  createInspection,
  updateInspectionMeta,
  deleteInspection,
  replaceItems,
  replaceObservations,
  replaceImages,
} from '../db/repositories/inspections.js';
import {
  getUnitWithBuilding,
  getUnitParticipants,
  getLatestAiGuide,
  findReportByInspectionId,
  createReportWithSnapshot,
} from '../db/repositories/reports.js';

const router = Router();

const ALLOWED_STATUSES_FOR_PATCH = new Set(['draft', 'submitted']);

function ensureContractor(user) {
  if (user.role !== 'contractor') {
    throw forbidden('only contractor can manage inspections');
  }
}

function loadOwnedInspectionOr404(id, user) {
  const insp = findInspectionById(id);
  if (!insp) throw notFound('inspection not found');
  if (insp.contractorUserId !== user.id) throw forbidden('not your inspection');
  return insp;
}

router.post('/', requireUser, (req, res, next) => {
  try {
    ensureContractor(req.user);
    const { unitId, inspectionType, inspectedAt, items, observations, images } = req.body ?? {};
    const unitIdInt = Number.parseInt(unitId, 10);
    if (!Number.isInteger(unitIdInt) || unitIdInt <= 0) throw badRequest('unitId is required');
    if (!inspectionType) throw badRequest('inspectionType is required');
    const flow = resolveFlow(inspectionType);
    if (!hasContractorPermissionOnUnit(req.user.id, unitIdInt)) {
      throw forbidden('no contractor permission on this unit');
    }
    const id = createInspection({
      unitId: unitIdInt,
      contractorUserId: req.user.id,
      inspectionType,
      flow,
      inspectedAt: inspectedAt ?? null,
    });
    if (items) replaceItems(id, items);
    if (observations) replaceObservations(id, observations);
    if (images) replaceImages(id, images);
    const created = findInspectionById(id);
    res.status(201).json({ ok: true, data: { inspection: created } });
  } catch (e) { next(e); }
});

// List the current contractor's in-progress inspections (작성 중 / 제출 대기).
// MUST be registered before '/:id' so the literal path is not captured by the param route.
router.get('/', requireUser, (req, res, next) => {
  try {
    ensureContractor(req.user);
    const inspections = listInspectionsForContractor(req.user.id);
    sendOk(res, { inspections });
  } catch (e) { next(e); }
});

router.get('/:id', requireUser, (req, res, next) => {
  try {
    ensureContractor(req.user);
    const id = Number.parseInt(req.params.id, 10);
    const insp = loadOwnedInspectionOr404(id, req.user);
    sendOk(res, { inspection: insp });
  } catch (e) { next(e); }
});

router.patch('/:id', requireUser, (req, res, next) => {
  try {
    ensureContractor(req.user);
    const id = Number.parseInt(req.params.id, 10);
    const insp = loadOwnedInspectionOr404(id, req.user);
    if (insp.status === 'reported') {
      throw forbidden('reported inspection cannot be modified');
    }
    const { inspectedAt, finalOpinion, status, items, observations, images } = req.body ?? {};
    if (status !== undefined && !ALLOWED_STATUSES_FOR_PATCH.has(status)) {
      throw badRequest('status can only be set to draft or submitted via PATCH', { allowed: [...ALLOWED_STATUSES_FOR_PATCH] });
    }
    updateInspectionMeta(id, { inspectedAt, finalOpinion, status });
    if (items !== undefined) replaceItems(id, items);
    if (observations !== undefined) replaceObservations(id, observations);
    if (images !== undefined) replaceImages(id, images);
    sendOk(res, { inspection: findInspectionById(id) });
  } catch (e) { next(e); }
});

router.delete('/:id', requireUser, (req, res, next) => {
  try {
    ensureContractor(req.user);
    const id = Number.parseInt(req.params.id, 10);
    const insp = loadOwnedInspectionOr404(id, req.user);
    if (insp.status === 'reported') {
      throw forbidden('reported inspection cannot be deleted');
    }
    deleteInspection(id);
    sendOk(res, { deleted: true, id });
  } catch (e) { next(e); }
});

const WHOLE_STATES = new Set(['normal', 'caution', 'repair_needed']);

router.post('/:id/submit', requireUser, (req, res, next) => {
  try {
    ensureContractor(req.user);
    const id = Number.parseInt(req.params.id, 10);
    const insp = loadOwnedInspectionOr404(id, req.user);

    if (insp.status === 'reported') {
      throw conflict('inspection already reported');
    }
    if (findReportByInspectionId(id)) {
      throw conflict('report already exists for this inspection');
    }

    if (!insp.items || insp.items.length < 1) {
      throw validationError('inspection has no items to submit');
    }
    if (insp.flow === 'whole') {
      const invalid = insp.items.filter((it) => !WHOLE_STATES.has(it.state));
      if (invalid.length > 0) {
        throw validationError('all whole-flow items must have a state', {
          allowed: [...WHOLE_STATES],
          invalidItemIds: invalid.map((it) => it.id),
        });
      }
    }

    const grade = computeGrade({
      flow: insp.flow,
      inspectionType: insp.inspectionType,
      items: insp.items,
    });

    const unit = getUnitWithBuilding(insp.unitId);
    const participants = getUnitParticipants(insp.unitId);
    const aiGuide = getLatestAiGuide(id);
    const snapshot = buildSnapshot({
      inspection: insp,
      unit,
      participants,
      grade,
      aiGuide,
      createdAt: new Date().toISOString(),
    });

    const reportId = createReportWithSnapshot({
      inspectionId: id,
      unitId: insp.unitId,
      contractorUserId: insp.contractorUserId,
      inspectionType: insp.inspectionType,
      grade,
      snapshot,
    });

    sendOk(res, { reportId, grade }, 201);
  } catch (e) { next(e); }
});

export default router;
