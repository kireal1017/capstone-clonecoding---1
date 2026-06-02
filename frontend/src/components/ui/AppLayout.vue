<template>
  <div class="min-h-screen bg-white">
    <div class="mx-auto w-full max-w-md md:max-w-3xl px-4 py-0">
      <slot name="header" />
      <main class="py-4" :style="mainStyle">
        <slot />
      </main>
    </div>
    <div
      v-if="$slots.footer"
      ref="footerEl"
      class="no-print fixed bottom-0 left-0 right-0 bg-white border-t border-hair z-10"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="mx-auto w-full max-w-md md:max-w-3xl px-4 py-3">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

// The footer is position:fixed, so the scrollable content must reserve space
// equal to the footer height (+ gap) or the last input (e.g. 최종 의견 textarea)
// gets hidden behind it. Measure the footer dynamically because its height
// changes per step (1 button vs 3 stacked buttons).
const footerEl = ref(null)
const footerHeight = ref(0)
let ro = null

function measure() {
  if (footerEl.value) footerHeight.value = footerEl.value.offsetHeight
}

const mainStyle = computed(() =>
  footerHeight.value ? { paddingBottom: footerHeight.value + 24 + 'px' } : {},
)

onMounted(() => {
  nextTick(measure)
  if (typeof ResizeObserver !== 'undefined' && footerEl.value) {
    ro = new ResizeObserver(measure)
    ro.observe(footerEl.value)
  }
  if (typeof window !== 'undefined') window.addEventListener('resize', measure)
})

onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  if (typeof window !== 'undefined') window.removeEventListener('resize', measure)
})
</script>
