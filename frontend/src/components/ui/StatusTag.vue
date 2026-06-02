<template>
  <span
    :class="[
      'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded',
      tagClasses,
    ]"
  >
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})

const config = {
  draft:     { label: '작성 중',      classes: 'bg-surface text-muted' },
  submitted: { label: '제출됨',       classes: 'bg-surface text-body' },
  reported:  { label: '리포트 생성',  classes: 'bg-brand/10 text-brand' },
  A:         { label: 'A등급',        classes: 'bg-surface text-body' },
  B:         { label: 'B등급',        classes: 'bg-surface text-body' },
  C:         { label: 'C등급',        classes: 'bg-surface text-body' },
  D:         { label: 'D등급',        classes: 'bg-ink/10 text-ink' },
  E:         { label: 'E등급',        classes: 'bg-brand/10 text-brand' },
}

const label = computed(() => config[props.status]?.label ?? props.status)
const tagClasses = computed(() => config[props.status]?.classes ?? 'bg-surface text-muted')
</script>
