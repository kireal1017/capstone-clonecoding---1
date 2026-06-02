<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-body">
      {{ label }}<span v-if="required" class="text-muted ml-0.5">*</span>
    </label>
    <slot />
    <p v-if="error" class="text-xs text-ink mt-0.5">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-muted mt-0.5">{{ hint }}</p>
  </div>
</template>

<script setup>
defineProps({
  label:    { type: String, default: '' },
  hint:     { type: String, default: '' },
  error:    { type: String, default: '' },
  required: { type: Boolean, default: false },
})
</script>
