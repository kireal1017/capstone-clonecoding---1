import { describe, it, expect } from 'vitest';
import { passwordSchema } from '@/features/profile/schemas/password.schema';
import { profileSchema } from '@/features/profile/schemas/profile.schema';

/**
 * 프로필/비밀번호 스키마 단위 테스트.
 * NOTE: 테스트 러너(vitest) 미구성 — 러너 구성 시 즉시 동작하는 명세이며 약화/스킵하지 않는다.
 */
describe('password.schema', () => {
  const base = {
    currentPassword: 'oldpass1',
    newPassword: 'newpass12',
    newPasswordConfirm: 'newpass12',
  };

  it('영문+숫자 8~72자 + 확인 일치를 통과시킨다', () => {
    expect(passwordSchema.safeParse(base).success).toBe(true);
  });

  it('숫자 없는 새 비밀번호를 거부한다', () => {
    const result = passwordSchema.safeParse({ ...base, newPassword: 'onlyletters', newPasswordConfirm: 'onlyletters' });
    expect(result.success).toBe(false);
  });

  it('영문 없는 새 비밀번호를 거부한다', () => {
    const result = passwordSchema.safeParse({ ...base, newPassword: '12345678', newPasswordConfirm: '12345678' });
    expect(result.success).toBe(false);
  });

  it('8자 미만 새 비밀번호를 거부한다', () => {
    const result = passwordSchema.safeParse({ ...base, newPassword: 'ab12', newPasswordConfirm: 'ab12' });
    expect(result.success).toBe(false);
  });

  it('확인 불일치를 거부한다(path=newPasswordConfirm)', () => {
    const result = passwordSchema.safeParse({ ...base, newPasswordConfirm: 'different1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('newPasswordConfirm'))).toBe(true);
    }
  });

  it('현재 비밀번호 누락을 거부한다', () => {
    const result = passwordSchema.safeParse({ ...base, currentPassword: '' });
    expect(result.success).toBe(false);
  });
});

describe('profile.schema', () => {
  it('닉네임 2~20자 공백 없음을 통과시킨다', () => {
    expect(profileSchema.safeParse({ nickname: '홍길동' }).success).toBe(true);
  });

  it('1자 닉네임을 거부한다', () => {
    expect(profileSchema.safeParse({ nickname: '홍' }).success).toBe(false);
  });

  it('공백 포함 닉네임을 거부한다', () => {
    expect(profileSchema.safeParse({ nickname: '홍 길동' }).success).toBe(false);
  });
});
