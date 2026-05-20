// 근거: docs/04-design/backend-spec.md §4-2 (validate 팩토리), PRD §34
// validate(schema, target) → req[target]을 Zod로 파싱, 성공 시 파싱 결과 재할당 후 next().
// 실패 시 ValidationError(422) forward. 구체 API 스키마는 Step 3+ 범위.

import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError, type ErrorDetail } from '../utils/errors';

export type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Zod 스키마로 req[target]을 검증하는 미들웨어 팩토리.
 * 검증 성공 시 파싱(변환)된 값을 req[target]에 재할당한다.
 */
export function validate(
  schema: ZodTypeAny,
  target: ValidateTarget = 'body',
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details: ErrorDetail[] = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || '(root)',
        message: issue.message,
      }));
      next(new ValidationError(details));
      return;
    }
    // 파싱(coerce/transform 포함) 결과를 재할당.
    req[target] = result.data;
    next();
  };
}
