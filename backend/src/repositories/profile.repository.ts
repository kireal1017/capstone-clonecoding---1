// 근거: docs/04-design/api-spec.md §6 (프로필 API), data-model.md §2 (User 필드),
//        backend-spec.md §8-5, design-review.md DB-02·DB-14 (nowKST 명시 전달)
// users 테이블 프로필 관련 Prisma 데이터 접근. 비즈니스 로직 없음 — 순수 쿼리.
// 모든 작업은 인증된 본인(userId=User.id) 기준. where에 id(=userId)를 사용해 타인 행에 절대 접근하지 않는다.
// 조회는 user.repository.findById와 중복되지 않게 프로필 응답에 필요한 필드만 다룬다.

import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { nowKST } from '../utils/dateUtil';

/** 본인 사용자 조회 (없으면 null). 프로필 조회/수정 전 존재 확인 및 비밀번호 검증에 사용. */
export async function findById(userId: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}

/**
 * 닉네임 수정 (PR-02). where에 id(본인)만 사용. updatedAt은 nowKST() 명시 전달(DB-02·DB-14).
 * 존재하지 않는 사용자면 Prisma가 P2025를 throw — 서비스가 호출 전 findById로 존재를 보장한다.
 */
export async function updateNickname(
  userId: number,
  nickname: string,
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { nickname, updatedAt: nowKST() },
  });
}

/**
 * 비밀번호 해시 교체 (PR-03). updatedAt은 nowKST() 명시 전달.
 * refreshTokenHash는 건드리지 않는다 — api-spec.md §6-3은 비밀번호 변경 시 세션 무효화를 요구하지 않으므로
 * 기존 Refresh Token 정책을 유지한다(로그아웃/Token Rotation 흐름만 refreshTokenHash를 변경).
 */
export async function updatePasswordHash(
  userId: number,
  passwordHash: string,
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, updatedAt: nowKST() },
  });
}

/** 아바타 URL 갱신 (PR-04). updatedAt은 nowKST() 명시 전달. */
export async function updateAvatarUrl(
  userId: number,
  avatarUrl: string,
): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { avatarUrl, updatedAt: nowKST() },
  });
}
