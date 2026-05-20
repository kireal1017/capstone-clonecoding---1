// 근거: docs/04-design/backend-spec.md §8-1·§9 (리포지토리 계층), §5-3 (refresh_token_hash 처리),
//        data-model.md §2, harness.md §3 Step 3 범위
// users 테이블 Prisma 데이터 접근. 비즈니스 로직 없음 — 순수 쿼리.
// 회원가입은 user INSERT + 기본 카테고리 5건 INSERT를 단일 트랜잭션으로 수행 (원자성, backend-spec.md §9-3).

import type { User } from '@prisma/client';
import { prisma } from '../config/prisma';
import { DEFAULT_CATEGORIES } from '../lib/defaultCategories';
import { nowKST } from '../utils/dateUtil';

/** 이메일로 사용자 조회 (없으면 null). */
export async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

/** id로 사용자 조회 (없으면 null). */
export async function findById(id: number): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  nickname: string;
}

/**
 * 회원가입: users INSERT + 기본 카테고리 5건 INSERT를 단일 트랜잭션으로 수행.
 * - 카테고리 정의는 lib/defaultCategories.ts의 DEFAULT_CATEGORIES(SSoT)를 재사용.
 *   (createDefaultCategoriesForUser는 PrismaClient를 요구해 인터랙티브 tx 클라이언트와
 *    타입 불일치하므로, 동일 상수를 tx.category.createMany로 삽입하여 원자성을 보장한다.)
 * - 모든 타임스탬프는 nowKST() 명시 전달 (DB-02·DB-14).
 */
export async function createWithDefaultCategories(
  input: CreateUserInput,
): Promise<User> {
  const ts = nowKST();
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        nickname: input.nickname,
        createdAt: ts,
        updatedAt: ts,
      },
    });
    await tx.category.createMany({
      data: DEFAULT_CATEGORIES.map((def) => ({
        userId: user.id,
        name: def.name,
        color: def.color,
        sortOrder: def.sortOrder,
        createdAt: ts,
        updatedAt: ts,
      })),
    });
    return user;
  });
}

/** Refresh Token 해시 저장/교체 (로그인·Token Rotation 시). updatedAt 갱신. */
export async function updateRefreshTokenHash(
  userId: number,
  refreshTokenHash: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash, updatedAt: nowKST() },
  });
}

/** Refresh Token 해시 제거 (로그아웃·재사용 감지 시 세션 폐기). updatedAt 갱신. */
export async function clearRefreshTokenHash(userId: number): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null, updatedAt: nowKST() },
  });
}
