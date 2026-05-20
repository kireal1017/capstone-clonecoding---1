// 근거: docs/04-design/api-spec.md §6-1~§6-4 (상태코드·응답 형식), backend-spec.md §8-5
// 얇은 컨트롤러: req.user(authMiddleware 주입) + 파싱된 입력 → service 호출 → successResponse() 응답.
// 모든 엔드포인트는 본인(req.user.userId) 기준. 상태코드는 api-spec §6 준수(전부 200).

import type { Request, Response } from 'express';
import { UnauthorizedError } from '../utils/errors';
import { successResponse } from '../types/api';
import * as profileService from '../services/profile.service';
import { avatarUrlForFile } from '../middlewares/upload';
import type {
  UpdateProfileInput,
  ChangePasswordInput,
} from '../schemas/profile.schema';

/** 인증 사용자 ID 추출 (authMiddleware가 보장하나 타입 안전을 위해 방어). */
function requireUserId(req: Request): number {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.userId;
}

/** GET /api/v1/profile — 본인 프로필 조회 (200). */
export async function getProfile(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const user = await profileService.getProfile(userId);
  res.status(200).json(successResponse({ user }));
}

/** PATCH /api/v1/profile — 닉네임 수정 (200). */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  const user = await profileService.updateProfile(
    userId,
    req.body as UpdateProfileInput,
  );
  res.status(200).json(successResponse({ user }));
}

/** PATCH /api/v1/profile/password — 비밀번호 변경 (200). */
export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = requireUserId(req);
  await profileService.changePassword(userId, req.body as ChangePasswordInput);
  res.status(200).json(successResponse({ message: '비밀번호 변경 완료' }));
}

/** POST /api/v1/profile/avatar — 아바타 업로드 (200). 파일 검증/저장은 upload 미들웨어가 완료. */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  const userId = requireUserId(req);
  // upload 미들웨어가 req.file을 보장(누락 시 422). 타입 안전을 위해 방어.
  if (!req.file) {
    throw new UnauthorizedError();
  }
  const avatarUrl = avatarUrlForFile(req.file.filename);
  const savedUrl = await profileService.updateAvatar(userId, avatarUrl);
  res.status(200).json(successResponse({ avatarUrl: savedUrl }));
}
