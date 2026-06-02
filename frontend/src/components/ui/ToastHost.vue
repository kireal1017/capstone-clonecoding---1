<template>
  <Teleport to="body">
    <div
      class="no-print fixed top-4 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
      style="padding-top: env(safe-area-inset-top)"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toastState.items"
          :key="t.id"
          class="pointer-events-auto w-full max-w-md bg-white border border-hair border-l-4 rounded-card px-4 py-3 shadow-sm flex items-start gap-3"
          :class="t.tone === 'warning' ? 'border-l-ink' : 'border-l-brand'"
          role="status"
          aria-live="polite"
        >
          <span class="flex-1 text-sm text-ink leading-snug">{{ t.message }}</span>
          <button
            type="button"
            class="shrink-0 text-muted hover:text-ink transition-colors"
            aria-label="알림 닫기"
            @click="dismissToast(t.id)"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { toastState, dismissToast } from '../../lib/toast.js'
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
