<template>
  <button
    type="button"
    class="no-print inline-flex items-center justify-center gap-2 min-h-[40px] px-5 text-sm font-medium rounded-btn border border-hair bg-white text-body hover:border-ph transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
    @click="handlePrint"
  >
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 5V2h8v3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <rect x="2" y="5" width="12" height="7" rx="1" stroke="currentColor" stroke-width="1.2"/>
      <path d="M4 9h8M4 11h5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      <path d="M4 8V14h8V8" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
    </svg>
    인쇄 / PDF 저장
  </button>
</template>

<script setup>
function handlePrint() {
  window.print()
}
</script>
