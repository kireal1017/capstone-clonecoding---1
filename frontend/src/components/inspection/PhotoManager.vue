<template>
  <div class="flex flex-col gap-3">
    <!-- Header row -->
    <div class="flex items-center justify-between gap-2">
      <span class="text-sm font-medium text-ink">사진 첨부</span>
      <BaseBadge tone="neutral">{{ modelValue.length }} / {{ max }}</BaseBadge>
    </div>

    <!-- Error message -->
    <AlertMessage
      v-if="errorMsg"
      tone="warning"
      :dismissible="true"
      @close="errorMsg = ''"
    >
      {{ errorMsg }}
    </AlertMessage>

    <!-- Empty state when readonly and no images -->
    <EmptyState
      v-if="!modelValue.length && readonly"
      title="첨부된 사진이 없습니다"
    >
      <template #icon>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="3" y="6" width="26" height="20" rx="3" stroke="currentColor" stroke-width="1.5"/>
          <circle cx="16" cy="16" r="4" stroke="currentColor" stroke-width="1.5"/>
          <path d="M12 6L13.5 4H18.5L20 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </template>
    </EmptyState>

    <!-- Photo grid -->
    <div
      v-if="modelValue.length || !readonly"
      class="grid grid-cols-2 sm:grid-cols-3 gap-3"
    >
      <!-- Existing images -->
      <div
        v-for="(img, idx) in modelValue"
        :key="idx"
        class="flex flex-col gap-1.5"
      >
        <!-- PhotoSlot preview + remove -->
        <PhotoSlot
          :src="dataUri(img)"
          :caption="img.caption"
          @remove="!readonly && removeAt(idx)"
        />

        <!-- photoType select -->
        <select
          :value="img.photoType"
          :disabled="readonly"
          class="w-full h-8 px-2 rounded border border-hair bg-white text-xs text-body focus:outline-none focus:border-brand transition-colors disabled:bg-surface disabled:text-muted appearance-none"
          :aria-label="'사진 ' + (idx + 1) + ' 유형'"
          @change="updatePhotoType(idx, $event.target.value)"
        >
          <option value="" disabled>유형 선택</option>
          <option
            v-for="pt in PHOTO_TYPES"
            :key="pt.value"
            :value="pt.value"
          >{{ pt.label }}</option>
        </select>

        <!-- caption input -->
        <input
          :value="img.caption"
          type="text"
          :disabled="readonly"
          placeholder="사진 설명(선택)"
          class="w-full h-8 px-2 rounded border border-hair bg-white text-xs text-body focus:outline-none focus:border-brand transition-colors disabled:bg-surface disabled:text-muted"
          :aria-label="'사진 ' + (idx + 1) + ' 설명'"
          @input="updateCaption(idx, $event.target.value)"
        />
      </div>

      <!-- Add tile: visible when not at cap and not readonly -->
      <div v-if="!readonly && modelValue.length < max" class="flex flex-col gap-1.5">
        <PhotoSlot @add="triggerFileInput">
          <template #upload>
            <!--
              Hidden input driven solely by the tile's @add → triggerFileInput().
              A transparent full-tile overlay here would ALSO catch the click
              natively, opening the file dialog twice (double chooser bug).
            -->
            <input
              ref="fileInputRef"
              type="file"
              accept="image/*"
              multiple
              class="hidden"
              aria-label="사진 추가"
              @change="onFilesSelected"
            />
          </template>
        </PhotoSlot>
        <!-- keep height consistent with other tiles -->
        <div class="h-8" />
        <div class="h-8" />
      </div>

      <!-- At-cap notice tile when not readonly -->
      <div
        v-else-if="!readonly && modelValue.length >= max"
        class="aspect-square rounded border border-dashed border-hair bg-surface flex items-center justify-center p-3"
      >
        <span class="text-xs text-muted text-center leading-relaxed">
          최대 {{ max }}장까지<br>첨부할 수 있습니다.
        </span>
      </div>
    </div>

    <!-- Hint line -->
    <p v-if="!readonly" class="text-xs text-muted">
      1장 최대 10MB · 리포트 전체 최대 20장
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseBadge   from '../ui/BaseBadge.vue'
import AlertMessage from '../ui/AlertMessage.vue'
import EmptyState  from '../ui/EmptyState.vue'
import PhotoSlot   from '../ui/PhotoSlot.vue'
import { PHOTO_TYPES } from '../../constants/photoTypes.js'

// ── Props / emits ──
const props = defineProps({
  modelValue: { type: Array,   default: () => [] },
  max:        { type: Number,  default: 20 },
  readonly:   { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue'])

// ── Local state ──
const fileInputRef = ref(null)
const errorMsg     = ref('')

// ── Helpers ──
/** Rebuild data-URI for <img> preview from raw base64 stored in the model. */
function dataUri(img) {
  if (!img?.base64Data) return ''
  const mime = img.mimeType || 'image/jpeg'
  return `data:${mime};base64,${img.base64Data}`
}

// ── Mutation helpers (always emit a new array, never mutate prop) ──
function removeAt(idx) {
  const next = props.modelValue.filter((_, i) => i !== idx)
  errorMsg.value = ''
  emit('update:modelValue', next)
}

function updatePhotoType(idx, value) {
  const next = props.modelValue.map((img, i) =>
    i === idx ? { ...img, photoType: value } : img
  )
  emit('update:modelValue', next)
}

function updateCaption(idx, value) {
  const next = props.modelValue.map((img, i) =>
    i === idx ? { ...img, caption: value } : img
  )
  emit('update:modelValue', next)
}

// ── File input trigger ──
function triggerFileInput() {
  fileInputRef.value?.click()
}

// ── File processing ──
async function onFilesSelected(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return

  // Reset the input immediately so the same file can be re-picked
  event.target.value = ''

  const accumulated = [...props.modelValue]
  let localError = ''

  for (const file of files) {
    // Type check
    if (!file.type.startsWith('image/')) {
      localError = '이미지 파일만 첨부할 수 있습니다.'
      continue
    }

    // Size check (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      localError = `이미지 1장은 10MB 이하만 첨부할 수 있습니다. (${file.name})`
      continue
    }

    // Cap check
    if (accumulated.length >= props.max) {
      localError = `최대 ${props.max}장까지 첨부할 수 있습니다.`
      break
    }

    // Read as data URL and strip the prefix to store raw base64
    const dataUrl = await readFileAsDataURL(file)
    const base64Data = dataUrl.split(',')[1]

    accumulated.push({
      base64Data,
      mimeType:  file.type,
      photoType: 'overview',
      caption:   '',
      sizeBytes: file.size,
    })
  }

  // Only clear error on success if at least one image was added
  if (accumulated.length > props.modelValue.length && !localError) {
    errorMsg.value = ''
  } else if (localError) {
    errorMsg.value = localError
  }

  emit('update:modelValue', accumulated)
}

/** Promisified FileReader.readAsDataURL */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'))
    reader.readAsDataURL(file)
  })
}
</script>
