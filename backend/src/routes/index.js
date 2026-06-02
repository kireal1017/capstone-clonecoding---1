import { Router } from 'express';
import healthRouter from './health.js';
import demoRouter from './demo.js';
import sessionRouter from './session.js';
import unitsRouter from './units.js';
import inspectionsRouter from './inspections.js';
import aiRouter from './ai.js';
import reportsRouter from './reports.js';
import shareRouter from './share.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/demo', demoRouter);
router.use('/session', sessionRouter);
router.use('/units', unitsRouter);
router.use('/inspections', inspectionsRouter);
router.use('/ai', aiRouter);
router.use('/reports', reportsRouter);
router.use('/share', shareRouter);

export default router;
