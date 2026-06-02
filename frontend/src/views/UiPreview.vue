<template>
  <AppLayout>
    <template #header>
      <PageHeader title="공통 UI 미리보기" subtitle="F01 디자인 시스템 컴포넌트 쇼케이스" />
    </template>

    <!-- BaseButton -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">BaseButton</h2>
      <div class="flex flex-wrap gap-3 items-center">
        <BaseButton variant="primary">기본 버튼</BaseButton>
        <BaseButton variant="secondary">보조 버튼</BaseButton>
        <BaseButton variant="ghost">고스트 버튼</BaseButton>
        <BaseButton variant="primary" disabled>비활성화</BaseButton>
      </div>
      <div class="mt-3">
        <BaseButton variant="primary" block>전체 너비 버튼</BaseButton>
      </div>
    </section>

    <!-- BaseCard -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">BaseCard</h2>
      <div class="flex flex-col gap-3">
        <BaseCard title="제목 있는 카드" bordered>
          <p class="text-sm text-body">카드 내용입니다. 평면적이고 여백 중심의 디자인입니다.</p>
        </BaseCard>
        <BaseCard>
          <p class="text-sm text-body">테두리 없는 기본 카드입니다.</p>
        </BaseCard>
      </div>
    </section>

    <!-- BaseBadge -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">BaseBadge</h2>
      <div class="flex flex-wrap gap-2 items-center">
        <BaseBadge tone="neutral">중립</BaseBadge>
        <BaseBadge tone="brand">브랜드</BaseBadge>
        <BaseBadge tone="subtle">서브</BaseBadge>
      </div>
    </section>

    <!-- StatusTag -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">StatusTag — 상태 및 등급</h2>
      <div class="flex flex-wrap gap-2 items-center">
        <StatusTag status="draft" />
        <StatusTag status="submitted" />
        <StatusTag status="reported" />
        <StatusTag status="A" />
        <StatusTag status="B" />
        <StatusTag status="C" />
        <StatusTag status="D" />
        <StatusTag status="E" />
      </div>
    </section>

    <!-- FormField -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">FormField</h2>
      <div class="flex flex-col gap-4">
        <FormField label="점검 항목명" required hint="항목의 명칭을 입력하세요.">
          <input
            type="text"
            placeholder="예: 거실 천장 누수"
            class="w-full border border-hair rounded-btn px-3 py-2 text-sm text-body placeholder:text-ph focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-0 transition-colors duration-200"
          />
        </FormField>
        <FormField label="비고" error="필수 항목입니다.">
          <input
            type="text"
            placeholder="비고를 입력하세요"
            class="w-full border border-brand/50 rounded-btn px-3 py-2 text-sm text-body placeholder:text-ph focus:outline-none focus:ring-2 focus:ring-brand transition-colors duration-200"
          />
        </FormField>
        <FormField label="메모">
          <textarea
            rows="3"
            placeholder="자유롭게 입력하세요"
            class="w-full border border-hair rounded-btn px-3 py-2 text-sm text-body placeholder:text-ph focus:outline-none focus:ring-2 focus:ring-brand resize-none transition-colors duration-200"
          />
        </FormField>
      </div>
    </section>

    <!-- SelectCard -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">SelectCard</h2>
      <div class="flex flex-col gap-2">
        <SelectCard
          title="입주 전 점검"
          description="새 입주자 입주 전 전체 점검을 진행합니다."
          :selected="selectedCard === 0"
          @select="selectedCard = 0"
        >
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L10 3L17 10V17H13V13H7V17H3V10Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>
          </template>
        </SelectCard>
        <SelectCard
          title="퇴거 전 점검"
          description="임차인 퇴거 전 문제 항목 중심으로 점검합니다."
          :selected="selectedCard === 1"
          @select="selectedCard = 1"
        >
          <template #icon>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M12 6L16 10L12 14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </template>
        </SelectCard>
        <SelectCard
          title="긴급 점검"
          description="즉각 조치가 필요한 상황에서 진행합니다."
          :selected="selectedCard === 2"
          @select="selectedCard = 2"
        />
      </div>
    </section>

    <!-- StepIndicator -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">StepIndicator</h2>
      <div class="flex flex-col gap-6">
        <StepIndicator :steps="['점검 정보', '항목 입력', '사진 첨부', '제출']" :current="0" />
        <StepIndicator :steps="['점검 정보', '항목 입력', '사진 첨부', '제출']" :current="2" />
        <StepIndicator :steps="['점검 정보', '항목 입력', '사진 첨부', '제출']" :current="3" />
      </div>
    </section>

    <!-- EmptyState -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">EmptyState</h2>
      <BaseCard bordered>
        <EmptyState title="점검 내역이 없습니다." description="새 점검을 시작하면 여기에 표시됩니다.">
          <template #icon>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="8" width="28" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M13 16h14M13 21h10M13 26h7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </template>
          <template #action>
            <BaseButton variant="primary">새 점검 시작</BaseButton>
          </template>
        </EmptyState>
      </BaseCard>
    </section>

    <!-- AlertMessage -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">AlertMessage</h2>
      <div class="flex flex-col gap-3">
        <AlertMessage tone="info">AI 점검 도우미가 분석을 완료했습니다. 행동 카드를 확인하세요.</AlertMessage>
        <AlertMessage tone="success">리포트가 성공적으로 생성되었습니다.</AlertMessage>
        <AlertMessage tone="warning" dismissible @close="warningVisible = false" v-if="warningVisible">
          소방·안전 항목에서 긴급 조치가 필요한 항목이 발견되었습니다.
        </AlertMessage>
        <BaseButton v-if="!warningVisible" variant="ghost" @click="warningVisible = true">경고 배너 다시 표시</BaseButton>
      </div>
    </section>

    <!-- PhotoSlot -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">PhotoSlot</h2>
      <div class="grid grid-cols-3 gap-3">
        <PhotoSlot caption="사진 없음 (빈 슬롯)" />
        <PhotoSlot src="/src/assets/hero.png" caption="hero.png 미리보기" @remove="() => {}" />
        <PhotoSlot caption="두 번째 빈 슬롯" />
      </div>
    </section>

    <!-- ReportSection -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">ReportSection</h2>
      <BaseCard bordered>
        <ReportSection title="거실" description="전반적인 상태 양호">
          <p class="text-sm text-body">창문 잠금장치 작동 이상 없음. 벽지 일부 변색 확인됨.</p>
        </ReportSection>
        <ReportSection title="주방">
          <p class="text-sm text-body">싱크대 하부 누수 흔적 있음. 즉시 확인 필요.</p>
        </ReportSection>
      </BaseCard>
    </section>

    <!-- PrintButton -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">PrintButton</h2>
      <PrintButton />
    </section>

    <!-- PageHeader variants -->
    <section class="mb-10">
      <h2 class="text-xs font-medium text-muted uppercase tracking-widest mb-4">PageHeader — 뒤로가기 + 액션 슬롯</h2>
      <BaseCard bordered>
        <PageHeader
          title="점검 상세"
          subtitle="2024-05-15 입주 전 점검"
          has-back
          @back="() => {}"
        >
          <template #actions>
            <BaseBadge tone="brand">제출됨</BaseBadge>
          </template>
        </PageHeader>
      </BaseCard>
    </section>

    <div class="h-20" />
  </AppLayout>
</template>

<script setup>
import { ref } from 'vue'

import AppLayout      from '../components/ui/AppLayout.vue'
import PageHeader     from '../components/ui/PageHeader.vue'
import BaseButton     from '../components/ui/BaseButton.vue'
import BaseCard       from '../components/ui/BaseCard.vue'
import BaseBadge      from '../components/ui/BaseBadge.vue'
import StatusTag      from '../components/ui/StatusTag.vue'
import FormField      from '../components/ui/FormField.vue'
import SelectCard     from '../components/ui/SelectCard.vue'
import StepIndicator  from '../components/ui/StepIndicator.vue'
import EmptyState     from '../components/ui/EmptyState.vue'
import AlertMessage   from '../components/ui/AlertMessage.vue'
import PhotoSlot      from '../components/ui/PhotoSlot.vue'
import ReportSection  from '../components/ui/ReportSection.vue'
import PrintButton    from '../components/ui/PrintButton.vue'

const selectedCard   = ref(0)
const warningVisible = ref(true)
</script>
