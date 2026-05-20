// 근거: docs/04-design/api-spec.md §1-1 (성공 응답), §1-2 (에러 응답)
// 공통 API 응답 타입. 모든 컨트롤러는 이 형식으로 응답한다.

import type { ErrorDetail } from '../utils/errors';

/** 성공 응답: { success: true, data: T } */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/** 에러 응답: { success: false, error: { code, message, details? } } */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
}

/** 임의 응답 (성공 또는 에러). */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/** 성공 응답 생성 헬퍼. */
export function successResponse<T>(data: T): SuccessResponse<T> {
  return { success: true, data };
}
