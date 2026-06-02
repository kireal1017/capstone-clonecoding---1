<template>
  <div class="flex items-center gap-0" role="list" :aria-label="`${current + 1}단계 / ${steps.length}단계`">
    <template v-for="(step, i) in steps" :key="i">
      <div class="flex flex-col items-center" role="listitem">
        <div
          :class="[
            'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors duration-200',
            i < current
              ? 'bg-brand text-white'
              : i === current
                ? 'bg-brand text-white ring-2 ring-brand/30'
                : 'bg-hair text-muted',
          ]"
          :aria-current="i === current ? 'step' : undefined"
        >
          <svg v-if="i < current" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M2 6L5 9L10 3" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span
          :class="[
            'mt-1 text-[10px] leading-tight text-center max-w-[56px]',
            i === current ? 'text-brand font-medium' : 'text-muted',
          ]"
        >{{ step }}</span>
      </div>
      <div
        v-if="i < steps.length - 1"
        :class="[
          'flex-1 h-px mx-1 mb-4 transition-colors duration-200',
          i < current ? 'bg-brand' : 'bg-hair',
        ]"
      />
    </template>
  </div>
</template>

<script setup>
defineProps({
  steps:   { type: Array, required: true },
  current: { type: Number, default: 0 },
})
</script>
