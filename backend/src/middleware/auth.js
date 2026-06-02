// X-User-Id 헤더(또는 ?userId=) 기반 데모 권한 미들웨어
import { unauthorized } from '../utils/errors.js';
import { findUserById } from '../db/repositories/users.js';

export function requireUser(req, res, next) {
  const raw = req.headers['x-user-id'] ?? req.query.userId;
  if (!raw) return next(unauthorized('X-User-Id header is required'));
  const userId = Number(raw);
  if (!Number.isInteger(userId) || userId <= 0) {
    return next(unauthorized('invalid userId'));
  }
  const user = findUserById(userId);
  if (!user) return next(unauthorized('user not found'));
  req.user = user;
  next();
}
