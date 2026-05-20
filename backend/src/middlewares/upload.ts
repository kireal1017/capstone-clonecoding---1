// 근거: docs/04-design/api-spec.md §6-4 (아바타 업로드), validation.md §3-4 (FILE_TOO_LARGE/INVALID_FILE_TYPE),
//        backend-spec.md §8-5, PRD §20-4 PR-04
// multer 기반 아바타 업로드 미들웨어.
// - 저장 경로: backend/uploads/avatars/{userId}_{timestamp}.{ext}  (api-spec.md §6-4)
// - 허용 형식: jpg/png/webp (그 외 → 400 INVALID_FILE_TYPE)
// - 최대 5MB (초과 → 400 FILE_TOO_LARGE)
// multer의 에러(파일 필터 거부/크기 초과)를 AppError로 변환해 errorHandler로 전달한다.

import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction, RequestHandler } from 'express';
import multer, { MulterError } from 'multer';
import { BadRequestError, UnauthorizedError, ValidationError } from '../utils/errors';

// 업로드 루트: backend/uploads/avatars (server.ts가 /uploads 정적 서빙).
// __dirname = backend/src/middlewares → ../../uploads/avatars = backend/uploads/avatars.
export const AVATAR_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'avatars');

// 공개 URL 접두사 (api-spec.md §6-4: /uploads/avatars/{userId}_{timestamp}.{ext}).
const AVATAR_URL_PREFIX = '/uploads/avatars';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5MB

// 허용 MIME → 확장자 매핑. jpg/png/webp만 허용.
const ALLOWED_MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** multer fileFilter 거부를 식별하기 위한 마커 코드. */
const INVALID_FILE_TYPE_CODE = 'INVALID_FILE_TYPE';

function ensureAvatarDir(): void {
  if (!fs.existsSync(AVATAR_DIR)) {
    fs.mkdirSync(AVATAR_DIR, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureAvatarDir();
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    // 인증 미들웨어가 먼저 실행되므로 req.user는 보장되지만 타입 안전을 위해 방어.
    const userId = req.user?.userId;
    if (!userId) {
      cb(new UnauthorizedError(), '');
      return;
    }
    const ext = ALLOWED_MIME_EXT[file.mimetype] ?? 'bin';
    cb(null, `${userId}_${Date.now()}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_EXT[file.mimetype]) {
      cb(null, true);
      return;
    }
    // 허용 외 형식: 마커 에러로 거부 → 미들웨어 래퍼에서 400 INVALID_FILE_TYPE으로 변환.
    const err = new Error('허용되지 않는 파일 형식입니다.');
    (err as Error & { code?: string }).code = INVALID_FILE_TYPE_CODE;
    cb(err);
  },
});

const single = upload.single('avatar');

/**
 * 아바타 업로드 미들웨어. multer single('avatar')을 감싸 에러를 AppError로 변환한다.
 * - LIMIT_FILE_SIZE → 400 FILE_TOO_LARGE
 * - INVALID_FILE_TYPE 마커 → 400 INVALID_FILE_TYPE
 * - 파일 누락 → 422 VALIDATION_FAILED (api-spec.md §6-4)
 */
export const uploadAvatar: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  single(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new BadRequestError('파일 크기가 5MB를 초과했습니다.', 'FILE_TOO_LARGE'));
        return;
      }
      if (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as { code?: unknown }).code === INVALID_FILE_TYPE_CODE
      ) {
        next(
          new BadRequestError(
            'jpg, png, webp 형식만 업로드할 수 있습니다.',
            'INVALID_FILE_TYPE',
          ),
        );
        return;
      }
      next(err);
      return;
    }
    if (!req.file) {
      next(
        new ValidationError([
          { field: 'avatar', message: '아바타 파일을 첨부하세요.' },
        ]),
      );
      return;
    }
    next();
  });
};

/** 저장된 파일명으로 공개 avatarUrl 생성 (api-spec.md §6-4). */
export function avatarUrlForFile(filename: string): string {
  return `${AVATAR_URL_PREFIX}/${filename}`;
}
