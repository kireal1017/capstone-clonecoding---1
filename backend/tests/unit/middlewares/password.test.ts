// 근거: backend-spec.md §6 (비밀번호 해싱 bcrypt cost 12), validation.md §4-6
// bcryptjs 기반 hashPassword/verifyPassword 라운드트립 + cost factor 검증.

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/utils/password';

describe('password utils (bcryptjs)', () => {
  it('해시는 bcrypt prefix($2)와 cost 12를 포함', async () => {
    const hash = await hashPassword('test1234');
    // bcryptjs는 "$2a$12$..." 또는 "$2b$12$..." 형식 해시 생성.
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('올바른 비밀번호 → verify true', async () => {
    const hash = await hashPassword('correct-horse-battery');
    await expect(verifyPassword('correct-horse-battery', hash)).resolves.toBe(true);
  });

  it('틀린 비밀번호 → verify false', async () => {
    const hash = await hashPassword('correct-horse-battery');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('동일 평문도 매번 다른 해시 (salt 적용)', async () => {
    const a = await hashPassword('same-input');
    const b = await hashPassword('same-input');
    expect(a).not.toBe(b);
    await expect(verifyPassword('same-input', a)).resolves.toBe(true);
    await expect(verifyPassword('same-input', b)).resolves.toBe(true);
  });
});
