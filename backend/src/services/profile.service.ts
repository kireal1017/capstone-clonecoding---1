// 근거: docs/04-design/api-spec.md §6-1~§6-4 (상태코드·응답·에러), backend-spec.md §8-5,
//        data-model.md §2 (User), validation.md §3-4, PRD §20-4 PR-01~PR-04
// 프로필 비즈니스 로직. 모든 작업은 인증된 본인(userId) 기준(authMiddleware가 req.user 주입).
// 비밀번호 변경: 현재 비밀번호 verifyPassword 검증 → 불일치 시 401 AUTH_INVALID_CREDENTIALS →
//               일치 시 hashPassword(새 비번) 후 passwordHash UPDATE. refreshTokenHash는 미변경(§6-3 정책).

import type { User } from '@prisma/client';
import { InvalidCredentialsError, UnauthorizedError } from '../utils/errors';
import { hashPassword, verifyPassword } from '../utils/password';
import * as profileRepository from '../repositories/profile.repository';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
} from '../schemas/profile.schema';

/**
 * 클라이언트 응답용 프로필(민감 필드 제외).
 * api-spec.md §6-1·§6-2 + validation.md §3-4: id, email, nickname, avatarUrl, createdAt, updatedAt.
 */
export interface ProfileView {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Prisma User 레코드 → 응답 뷰 매핑(passwordHash·refreshTokenHash 등 민감 필드 제외). */
function toProfileView(user: User): ProfileView {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * GET /profile — 본인 프로필 조회 (PR-01).
 * 토큰은 유효하나 사용자 레코드가 사라진 예외 상황은 401로 처리.
 */
export async function getProfile(userId: number): Promise<ProfileView> {
  const user = await profileRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError();
  }
  return toProfileView(user);
}

/**
 * PATCH /profile — 닉네임 수정 (PR-02). email 변경 불가(nickname만).
 * 존재 확인 후 updateNickname. updatedAt은 리포지토리에서 nowKST() 명시 전달.
 */
export async function updateProfile(
  userId: number,
  input: UpdateProfileInput,
): Promise<ProfileView> {
  const existing = await profileRepository.findById(userId);
  if (!existing) {
    throw new UnauthorizedError();
  }
  const updated = await profileRepository.updateNickname(userId, input.nickname);
  return toProfileView(updated);
}

/**
 * PATCH /profile/password — 비밀번호 변경 (PR-03).
 * 1. 본인 조회(없으면 401)
 * 2. 현재 비밀번호 verifyPassword → 불일치 시 401 AUTH_INVALID_CREDENTIALS
 * 3. 새 비밀번호 hashPassword 후 passwordHash UPDATE
 * refreshTokenHash는 미변경(api-spec.md §6-3은 세션 무효화를 요구하지 않음 — 기존 정책 유지).
 * (newPassword === newPasswordConfirm 검증은 스키마 단계에서 완료.)
 */
export async function changePassword(
  userId: number,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await profileRepository.findById(userId);
  if (!user) {
    throw new UnauthorizedError();
  }
  const ok = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!ok) {
    throw new InvalidCredentialsError('현재 비밀번호가 일치하지 않습니다.');
  }
  const newHash = await hashPassword(input.newPassword);
  await profileRepository.updatePasswordHash(userId, newHash);
}

/**
 * POST /profile/avatar — 아바타 URL 저장 (PR-04).
 * 파일 저장(multer)·형식·크기 검증은 라우트의 upload 미들웨어에서 끝나고,
 * 여기서는 저장된 공개 URL을 users.avatarUrl에 반영한 뒤 그 URL을 반환한다.
 */
export async function updateAvatar(
  userId: number,
  avatarUrl: string,
): Promise<string> {
  const existing = await profileRepository.findById(userId);
  if (!existing) {
    throw new UnauthorizedError();
  }
  const updated = await profileRepository.updateAvatarUrl(userId, avatarUrl);
  // avatarUrl은 방금 저장한 값이므로 non-null. 응답 계약상 string 보장.
  return updated.avatarUrl ?? avatarUrl;
}
