// 근거: docs/04-design/backend-spec.md §7 (AppError 계층), api-spec.md §2 (공통 에러 코드 표)
// AppError 계층: 컨트롤러·서비스에서 throw → errorHandler에서 일괄 표준 응답 변환.

/**
 * VALIDATION_FAILED(422) 응답의 details 배열 항목.
 * api-spec.md §1-2 형식: { field, message }
 */
export interface ErrorDetail {
  field: string;
  message: string;
}

/**
 * 애플리케이션 표준 에러의 기반 클래스.
 * - statusCode: HTTP 상태 코드
 * - code: api-spec.md §2 에러 코드 문자열
 * - message: 사람이 읽을 수 있는 설명
 * - details: VALIDATION_FAILED 등에서만 사용 (선택)
 * - isOperational: 예측된 운영성 에러 여부 (true면 클라이언트에 message 노출 안전)
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ErrorDetail[] | undefined;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: ErrorDetail[],
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }
  }
}

/** 400 BAD_REQUEST — 일반적인 잘못된 요청. */
export class BadRequestError extends AppError {
  constructor(message = '잘못된 요청입니다.', code = 'BAD_REQUEST') {
    super(400, code, message);
  }
}

/** 401 — 인증 실패 계열의 기반. 기본 코드 AUTH_UNAUTHORIZED. */
export class UnauthorizedError extends AppError {
  constructor(message = '인증이 필요합니다.', code = 'AUTH_UNAUTHORIZED') {
    super(401, code, message);
  }
}

/** 401 AUTH_INVALID_CREDENTIALS — 이메일/비밀번호 불일치. */
export class InvalidCredentialsError extends AppError {
  constructor(message = '이메일 또는 비밀번호가 일치하지 않습니다.') {
    super(401, 'AUTH_INVALID_CREDENTIALS', message);
  }
}

/** 401 AUTH_INVALID_TOKEN — 토큰 형식 오류 또는 서명 불일치. */
export class InvalidTokenError extends AppError {
  constructor(message = '유효하지 않은 토큰입니다.') {
    super(401, 'AUTH_INVALID_TOKEN', message);
  }
}

/** 401 AUTH_REFRESH_EXPIRED — Refresh Token 만료 또는 무효. */
export class RefreshExpiredError extends AppError {
  constructor(message = 'Refresh Token이 만료되었거나 유효하지 않습니다.') {
    super(401, 'AUTH_REFRESH_EXPIRED', message);
  }
}

/** 403 AUTH_FORBIDDEN — 타인 리소스 접근 시도. */
export class ForbiddenError extends AppError {
  constructor(message = '접근 권한이 없습니다.', code = 'AUTH_FORBIDDEN') {
    super(403, code, message);
  }
}

/** 404 NOT_FOUND — 리소스 없음. 코드는 호출부에서 PLAN_NOT_FOUND 등으로 지정. */
export class NotFoundError extends AppError {
  constructor(message = '리소스를 찾을 수 없습니다.', code = 'NOT_FOUND') {
    super(404, code, message);
  }
}

/** 409 CONFLICT — 중복 등 상태 충돌. 코드는 EMAIL_ALREADY_EXISTS 등으로 지정. */
export class ConflictError extends AppError {
  constructor(message = '리소스가 이미 존재합니다.', code = 'CONFLICT') {
    super(409, code, message);
  }
}

/** 422 VALIDATION_FAILED — 입력 유효성 검증 실패. details 배열 포함. */
export class ValidationError extends AppError {
  constructor(details: ErrorDetail[], message = '입력값 검증에 실패했습니다.') {
    super(422, 'VALIDATION_FAILED', message, details);
  }
}

/** 429 TOO_MANY_REQUESTS — Rate Limit 초과. */
export class TooManyRequestsError extends AppError {
  constructor(message = '요청이 너무 많습니다. 잠시 후 다시 시도하세요.') {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}

/** 500 INTERNAL_SERVER_ERROR — 서버 내부 오류. 상세 내용은 클라이언트에 미노출. */
export class InternalServerError extends AppError {
  constructor(message = '서버 내부 오류가 발생했습니다.') {
    super(500, 'INTERNAL_SERVER_ERROR', message);
    // 내부 오류는 운영성 에러가 아님 (예기치 못한 상황)
    Object.defineProperty(this, 'isOperational', { value: false });
  }
}
