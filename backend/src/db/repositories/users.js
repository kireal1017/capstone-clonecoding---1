import { getDb } from '../connection.js';

export function findUserById(id) {
  return getDb()
    .prepare('SELECT id, name, role FROM users WHERE id = ?')
    .get(id) ?? null;
}

export function listAllUsers() {
  return getDb()
    .prepare('SELECT id, name, role FROM users ORDER BY id')
    .all();
}
