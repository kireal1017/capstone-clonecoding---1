// 근거: docs/04-design/backend-spec.md §6 (비밀번호 해싱), PRD §16/§7 (bcrypt cost 12)
// bcryptjs 사용 (순수 JS — OneDrive+한글 경로의 bcrypt 네이티브 빌드 실패 회피, progress.md 참조).

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** 평문 비밀번호를 bcrypt(cost 12) 해시 문자열로 반환. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** 평문 비밀번호와 해시 비교 → boolean. */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
