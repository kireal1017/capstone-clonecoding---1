<template>
  <section class="py-4">
    <div class="border-b border-hair pb-2 mb-4">
      <h2 class="text-base font-medium text-ink">{{ title }}</h2>
      <p v-if="description" class="text-sm text-muted mt-0.5">{{ description }}</p>
    </div>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
})
</script>
