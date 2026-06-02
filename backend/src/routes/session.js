import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { badRequest, unauthorized } from '../utils/errors.js';
import { findUserById } from '../db/repositories/users.js';

const router = Router();

router.post('/select-user', (req, res, next) => {
  const { userId } = req.body ?? {};
  const id = Number.parseInt(userId, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return next(badRequest('userId is required and must be a positive integer'));
  }
  const user = findUserById(id);
  if (!user) return next(unauthorized('user not found'));
  sendOk(res, { user });
});

export default router;
