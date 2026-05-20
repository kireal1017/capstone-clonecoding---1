// 근거: docs/04-design/backend-spec.md §5 (JWT·Refresh 흐름), §5-3 (refresh_token_hash), §8-1 (회원가입 트랜잭션),
//        api-spec.md §3, design-review.md BE-01·BE-02·BE-12, validation.md §7-5 (Token Rotation 전체 절차)
// 인증 비즈니스 로직. 컨트롤러는 이 서비스가 반환한 토큰으로 쿠키를 설정/삭제한다.

import bcrypt from 'bcryptjs';
import {
  ConflictError,
  InvalidCredentialsError,
  InvalidTokenError,
  UnauthorizedError,
} from '../utils/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt';
import { hashPassword, verifyPassword } from '../utils/password';
import * as userRepository from '../repositories/user.repository';
import type { RegisterInput, LoginInput } from '../schemas/auth.schema';

// Refresh Token 해시 비용 (backend-spec.md §5-3: bcrypt(token, 10)).
const REFRESH_HASH_COST = 10;

/** 클라이언트에 노출 가능한 사용자 정보(민감 필드 제외). */
export interface PublicUser {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
}

function toPublicUser(user: {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
}

/**
 * 회원가입 (api-spec.md §3-1, BE-06: 토큰 미발급).
 * 1. 이메일 중복 확인 → 409 EMAIL_ALREADY_EXISTS
 * 2. 비밀번호 bcrypt(cost 12) 해싱
 * 3. user INSERT + 기본 카테고리 5건 INSERT (단일 트랜잭션)
 */
export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new ConflictError('이미 사용 중인 이메일입니다.', 'EMAIL_ALREADY_EXISTS');
  }
  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.createWithDefaultCategories({
    email: input.email,
    passwordHash,
    nickname: input.nickname,
  });
  return toPublicUser(user);
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  user: Pick<PublicUser, 'id' | 'email' | 'nickname' | 'avatarUrl'>;
}

/**
 * 로그인 (api-spec.md §3-2).
 * - 이메일 미존재/비밀번호 불일치 모두 401 AUTH_INVALID_CREDENTIALS (정보 노출 방지).
 * - Refresh Token 발급 → bcrypt(token, 10) 해시를 users.refresh_token_hash에 저장 (BE-01).
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await userRepository.findByEmail(input.email);
  if (!user) {
    throw new InvalidCredentialsError();
  }
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new InvalidCredentialsError();
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const refreshToken = generateRefreshToken({ userId: user.id });
  const refreshTokenHash = await bcrypt.hash(refreshToken, REFRESH_HASH_COST);
  await userRepository.updateRefreshTokenHash(user.id, refreshTokenHash);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    },
  };
}

/**
 * Token Rotation (api-spec.md §3-3, backend-spec.md §5-3, validation.md §7-5).
 * 1. refresh_token 쿠키 없음 → 401 AUTH_REFRESH_EXPIRED (컨트롤러에서 처리)
 * 2. 서명/만료 검증 (verifyRefreshToken: 만료→REFRESH_EXPIRED, 서명오류→INVALID_TOKEN)
 * 3. 사용자 조회 → 없음 또는 저장된 hash 없음(이미 폐기됨) → 401 AUTH_INVALID_TOKEN
 * 4. bcrypt.compare(쿠키 토큰, 저장 hash) 불일치(재사용 감지) → hash NULL(전체 세션 폐기) → 401 AUTH_INVALID_TOKEN
 * 5. 일치 → 새 Access/Refresh 발급, 저장 hash 교체(rotation)
 */
export async function refresh(refreshTokenCookie: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(refreshTokenCookie);

  const user = await userRepository.findById(payload.userId);
  if (!user || !user.refreshTokenHash) {
    // 사용자 없음 또는 이미 폐기된 세션 → 무효 토큰.
    throw new InvalidTokenError();
  }

  const matches = await verifyPassword(refreshTokenCookie, user.refreshTokenHash);
  if (!matches) {
    // 재사용 감지: 전체 세션 폐기 후 무효 토큰 에러.
    await userRepository.clearRefreshTokenHash(user.id);
    throw new InvalidTokenError();
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email });
  const newRefreshToken = generateRefreshToken({ userId: user.id });
  const newHash = await bcrypt.hash(newRefreshToken, REFRESH_HASH_COST);
  await userRepository.updateRefreshTokenHash(user.id, newHash);

  return { accessToken, refreshToken: newRefreshToken };
}

/** 로그아웃 (api-spec.md §3-4): 서버 측 refresh_token_hash NULL. 쿠키 삭제는 컨트롤러. */
export async function logout(userId: number): Promise<void> {
  await userRepository.clearRefreshTokenHash(userId);
}

/** 현재 사용자 정보 조회 (api-spec.md §3-5). authMiddleware가 req.user 주입. */
export async function me(userId: number): Promise<PublicUser> {
  const user = await userRepository.findById(userId);
  if (!user) {
    // 토큰은 유효하나 사용자 레코드가 사라진 예외 상황.
    throw new UnauthorizedError();
  }
  return toPublicUser(user);
}
