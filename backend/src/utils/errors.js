import { fail } from './response.js';

export class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, 'BAD_REQUEST', message, details);
export const unauthorized = (message = 'unauthorized') => new HttpError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'forbidden') => new HttpError(403, 'FORBIDDEN', message);
export const notFound = (message = 'not found') => new HttpError(404, 'NOT_FOUND', message);
export const conflict = (message, details) => new HttpError(409, 'CONFLICT', message, details);
export const validationError = (message, details) => new HttpError(422, 'VALIDATION_ERROR', message, details);

export const notFoundHandler = (req, res) => {
  res.status(404).json(fail('NOT_FOUND', `route not found: ${req.method} ${req.path}`));
};

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json(fail(err.code, err.message, err.details));
  }
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json(fail('PAYLOAD_TOO_LARGE', 'request body exceeds limit'));
  }
  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json(fail('BAD_JSON', 'invalid JSON body'));
  }
  console.error('[backend error]', err);
  res.status(500).json(fail('INTERNAL_ERROR', 'internal server error'));
};
