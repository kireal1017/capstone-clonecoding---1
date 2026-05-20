// 근거: docs/04-design/data-model.md §7, PRD §17, K-02=B + K-03=A
// 회원가입 시(Step 3) 트랜잭션 내에서 createDefaultCategoriesForUser 호출 예정.
// Step 1에서는 prisma/seed.ts에서 데모 사용자에게 적용.

import type { PrismaClient } from '@prisma/client';
import { nowKST } from '../utils/dateUtil';

export interface DefaultCategoryDef {
  name: string;
  color: string; // HEX
  sortOrder: number;
}

export const DEFAULT_CATEGORIES: readonly DefaultCategoryDef[] = [
  { name: '미팅', color: '#7C3AED', sortOrder: 1 },
  { name: '과제', color: '#2563EB', sortOrder: 2 },
  { name: '시험', color: '#DC2626', sortOrder: 3 },
  { name: '개인 일정', color: '#16A34A', sortOrder: 4 },
  { name: '약속', color: '#EA580C', sortOrder: 5 },
] as const;

/**
 * 지정된 사용자에게 5개 기본 카테고리를 idempotent하게 생성.
 * - 이미 존재하는 (userId, name) 조합은 색상/순서를 업데이트
 * - 누락된 카테고리만 새로 생성
 *
 * DB-03: @@unique([userId, name]) 제약으로 중복 방지
 *
 * 호출 위치:
 * - 회원가입 트랜잭션 (Step 3)
 * - 시드 스크립트 (Step 1, 개발/테스트용)
 */
export async function createDefaultCategoriesForUser(
  prisma: PrismaClient,
  userId: number,
): Promise<void> {
  const ts = nowKST();
  for (const def of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { userId_name: { userId, name: def.name } },
      update: {
        color: def.color,
        sortOrder: def.sortOrder,
        updatedAt: ts,
      },
      create: {
        userId,
        name: def.name,
        color: def.color,
        sortOrder: def.sortOrder,
        createdAt: ts,
        updatedAt: ts,
      },
    });
  }
}
