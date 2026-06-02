import { Router } from 'express';
import { sendOk } from '../utils/response.js';

const router = Router();

router.get('/', (req, res) => {
  sendOk(res, { service: 'smart-inspection-backend', time: new Date().toISOString() });
});

export default router;
