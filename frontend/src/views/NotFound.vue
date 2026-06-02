<template>
  <AppLayout>
    <template #header>
      <PageHeader title="페이지를 찾을 수 없습니다" />
    </template>
    <EmptyState
      title="404"
      description="요청하신 페이지가 존재하지 않습니다."
    >
      <template #icon>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="14" stroke="currentColor" stroke-width="1.5"/>
          <path d="M20 13v8M20 27v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </template>
      <template #action>
        <RouterLink to="/">
          <BaseButton variant="primary">홈으로 돌아가기</BaseButton>
        </RouterLink>
      </template>
    </EmptyState>
  </AppLayout>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import AppLayout      from '../components/ui/AppLayout.vue'
import PageHeader     from '../components/ui/PageHeader.vue'
import EmptyState     from '../components/ui/EmptyState.vue'
import BaseButton     from '../components/ui/BaseButton.vue'
</script>
