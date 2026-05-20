/**
 * 백엔드 표준 응답 타입 (api-spec.md §1)
 * 성공: { success: true, data: T }
 * 실패: { success: false, error: { code, message, details? } }
 *
 * Step 7: 타입 스캐폴딩만 작성. 실제 화면 연동은 Step 8+.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
