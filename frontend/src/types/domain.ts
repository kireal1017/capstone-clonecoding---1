/**
 * 도메인 모델 타입 (api-spec.md 응답 계약 — camelCase)
 *
 * Step 7: 타입 스캐폴딩만 작성. 실제 화면/쿼리 연동은 Step 8+ (do NOT wire yet).
 */

export type Priority = 'high' | 'normal' | 'low';

export interface User {
  id: number;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 프로필 화면용 사용자 표현 (현재 User와 동일 형태) */
export type Profile = User;

export interface Category {
  id: number;
  userId: number;
  name: string;
  color: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: number;
  userId: number;
  title: string;
  dueDate: string;
  dueTime: string | null;
  displayDate: string;
  categoryId: number | null;
  category: Pick<Category, 'id' | 'name' | 'color'> | null;
  priority: Priority;
  memo: string | null;
  isCompleted: boolean;
  isRemind: boolean;
  createdAt: string;
  updatedAt: string;
}
