import { describe, it, expect } from 'vitest';
import { AxiosError } from 'axios';
import {
  validateAvatarFile,
  mapAvatarUploadError,
} from '@/features/profile/components/AvatarUpload';

/**
 * 아바타 클라이언트 검증 + 서버 에러 매핑 단위 테스트.
 * NOTE: 테스트 러너(vitest) 미구성 — 러너 구성 시 즉시 동작하는 명세이며 약화/스킵하지 않는다.
 */
function makeFile(type: string, sizeBytes: number): File {
  const blob = new Blob([new Uint8Array(0)], { type });
  // size 는 읽기 전용이므로 정의로 덮어쓴다(테스트 한정).
  Object.defineProperty(blob, 'size', { value: sizeBytes });
  return new File([blob], 'avatar', { type });
}

describe('validateAvatarFile', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('허용 타입 %s + 5MB 이하를 통과시킨다', (type) => {
    expect(validateAvatarFile(makeFile(type, 1024)).ok).toBe(true);
  });

  it('허용되지 않는 타입을 거부한다', () => {
    const result = validateAvatarFile(makeFile('image/gif', 1024));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('jpg');
  });

  it('5MB 초과 파일을 거부한다', () => {
    const result = validateAvatarFile(makeFile('image/png', 5 * 1024 * 1024 + 1));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('5MB');
  });
});

describe('mapAvatarUploadError', () => {
  function axiosErrorWithCode(status: number, code: string): AxiosError {
    const error = new AxiosError('err');
    error.response = {
      status,
      data: { success: false, error: { code, message: code } },
      statusText: '',
      headers: {},
      config: { headers: {} as never },
    } as never;
    return error;
  }

  it('FILE_TOO_LARGE 를 크기 메시지로 매핑한다', () => {
    expect(mapAvatarUploadError(axiosErrorWithCode(400, 'FILE_TOO_LARGE'))).toContain('5MB');
  });

  it('INVALID_FILE_TYPE 를 형식 메시지로 매핑한다', () => {
    expect(mapAvatarUploadError(axiosErrorWithCode(400, 'INVALID_FILE_TYPE'))).toContain('jpg');
  });

  it('알 수 없는 에러는 일반 메시지로 매핑한다', () => {
    expect(mapAvatarUploadError(new Error('boom'))).toContain('오류');
  });
});
