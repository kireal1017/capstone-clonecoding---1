import { useRef, useState } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useUploadAvatar } from '@/features/profile/hooks/useUploadAvatar';

/**
 * 아바타 업로드 (api-spec §6-4, wireframe §6).
 *
 * - jpg/png/webp + ≤5MB 클라이언트 사전 검증(validateAvatarFile) 후 업로드.
 * - 업로드 진행 상태(isPending): 버튼 로딩 + 비활성(중복 클릭 방지).
 * - 서버 400 FILE_TOO_LARGE / 400 INVALID_FILE_TYPE / 422 매핑(토스트).
 * - 현재 아바타 미리보기 또는 닉네임 이니셜 폴백.
 */
interface AvatarUploadProps {
  avatarUrl: string | null;
  nickname: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export interface AvatarValidationResult {
  ok: boolean;
  message?: string;
}

/** 아바타 파일 클라이언트 사전 검증(타입 + 크기). 테스트 대상으로 분리. */
export function validateAvatarFile(file: File): AvatarValidationResult {
  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return { ok: false, message: 'jpg, png, webp 형식만 업로드할 수 있습니다.' };
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { ok: false, message: '파일 크기는 5MB 이하여야 합니다.' };
  }
  return { ok: true };
}

/** API 에러 → 사용자 메시지 매핑(테스트 대상으로 분리). */
export function mapAvatarUploadError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const code = (error.response?.data as { error?: { code?: string } } | undefined)?.error?.code;
    if (code === 'FILE_TOO_LARGE') return '파일 크기는 5MB 이하여야 합니다.';
    if (code === 'INVALID_FILE_TYPE') return 'jpg, png, webp 형식만 업로드할 수 있습니다.';
    if (code === 'VALIDATION_FAILED') return '업로드할 파일을 선택해주세요.';
  }
  return '아바타 업로드 중 오류가 발생했습니다.';
}

function AvatarUpload({ avatarUrl, nickname }: AvatarUploadProps) {
  const { showToast } = useToast();
  const uploadMutation = useUploadAvatar();
  const inputRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);

  const initial = nickname.trim().charAt(0) || '?';

  const handleSelectClick = (): void => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    // 동일 파일 재선택 허용을 위해 input value 초기화.
    event.target.value = '';
    if (!file) return;

    const result = validateAvatarFile(file);
    if (!result.ok) {
      showToast(result.message ?? '업로드할 수 없는 파일입니다.', 'error');
      return;
    }

    uploadMutation.mutate(file, {
      onSuccess: (url) => {
        setPreviewUrl(url);
        showToast('프로필 이미지를 변경했습니다.', 'success');
      },
      onError: (error) => showToast(mapAvatarUploadError(error), 'error'),
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-soft-border bg-surface-container-low">
        {previewUrl ? (
          <img src={previewUrl} alt={`${nickname} 아바타`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl font-medium text-outline" aria-hidden>
            {initial}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="프로필 이미지 파일 선택"
      />
      <Button
        type="button"
        variant="ghost"
        onClick={handleSelectClick}
        isLoading={uploadMutation.isPending}
      >
        {uploadMutation.isPending ? '업로드 중...' : '프로필 이미지 변경'}
      </Button>
    </div>
  );
}

export default AvatarUpload;
