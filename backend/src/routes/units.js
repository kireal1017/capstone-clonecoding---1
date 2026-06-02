import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { requireUser } from '../middleware/auth.js';
import { listUnitsForUser } from '../db/repositories/units.js';

const router = Router();

router.get('/', requireUser, (req, res) => {
  const { user } = req;
  const units = listUnitsForUser(user.id, user.role);
  sendOk(res, { units });
});

export default router;
