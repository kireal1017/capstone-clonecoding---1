import { Router } from 'express';
import { sendOk } from '../utils/response.js';
import { listAllUsers } from '../db/repositories/users.js';

const router = Router();

router.get('/users', (req, res) => {
  sendOk(res, { users: listAllUsers() });
});

export default router;
