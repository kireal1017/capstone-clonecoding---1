import { reactive } from 'vue'

// Module-level singleton so toasts survive route navigation
// (e.g. queue a toast just before router.push and render it on the next page).
export const toastState = reactive({ items: [] })

let seq = 0

/**
 * Show a transient toast.
 * @param {string} message  Korean message to display.
 * @param {{ tone?: 'success'|'warning', duration?: number }} [opts]
 * @returns {number} toast id
 */
export function showToast(message, opts = {}) {
  const id = ++seq
  const tone = opts.tone || 'success'
  const duration = opts.duration ?? 3200
  toastState.items.push({ id, message, tone })
  if (duration > 0) {
    setTimeout(() => dismissToast(id), duration)
  }
  return id
}

export function dismissToast(id) {
  const idx = toastState.items.findIndex((t) => t.id === id)
  if (idx !== -1) toastState.items.splice(idx, 1)
}
