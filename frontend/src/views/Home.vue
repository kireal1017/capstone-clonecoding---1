<template>
  <AppLayout>
    <template #header>
      <PageHeader title="사용자 선택" subtitle="데모 사용자를 선택하세요" />
    </template>

    <!-- load error -->
    <AlertMessage v-if="loadError" tone="warning" :dismissible="false" class="mb-4">
      사용자 목록을 불러오지 못했습니다.
      <button
        type="button"
        class="ml-2 underline text-brand text-sm"
        @click="loadUsers"
      >다시 시도</button>
    </AlertMessage>

    <!-- loading skeleton -->
    <div v-if="loading" class="flex flex-col gap-3 mt-2">
      <div v-for="n in 3" :key="n" class="h-16 rounded-card bg-surface animate-pulse" />
    </div>

    <!-- user cards -->
    <div v-else class="flex flex-col gap-3 mt-2">
      <SelectCard
        v-for="user in users"
        :key="user.id"
        :title="user.name"
        :description="roleLabel(user.role)"
        :selected="selectedId === user.id"
        @select="onSelect(user)"
      />
    </div>
  </AppLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout    from '../components/ui/AppLayout.vue'
import PageHeader   from '../components/ui/PageHeader.vue'
import SelectCard   from '../components/ui/SelectCard.vue'
import AlertMessage from '../components/ui/AlertMessage.vue'
import { api } from '../api/client.js'
import { getUserId, setSession, getRole } from '../lib/session.js'

const router = useRouter()

const users      = ref([])
const loading    = ref(true)
const loadError  = ref(false)
const selectedId = ref(null)
const selectedRole = ref(null)

const ROLE_LABELS = {
  contractor: '시공업자',
  owner:      '임대인',
  tenant:     '임차인',
}

function roleLabel(role) {
  return ROLE_LABELS[role] ?? role
}

function roleRoute(role) {
  if (role === 'contractor') return '/contractor'
  if (role === 'owner')      return '/owner/reports'
  return '/tenant/reports'
}

async function loadUsers() {
  loading.value   = true
  loadError.value = false
  try {
    const data = await api.get('/demo/users')
    users.value = data.users ?? []
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function onSelect(user) {
  selectedId.value   = user.id
  selectedRole.value = user.role
  setSession({ id: user.id, role: user.role })

  // best-effort server-side session — non-blocking
  api.post('/session/select-user', { userId: user.id }).catch(() => {})

  router.push(roleRoute(user.role))
}

onMounted(async () => {
  // restore persisted selection
  const persistedId   = getUserId()
  const persistedRole = getRole()
  if (persistedId) {
    selectedId.value   = persistedId
    selectedRole.value = persistedRole
  }

  await loadUsers()

  // ensure selectedRole is populated from users list if only id was persisted
  if (selectedId.value && !selectedRole.value) {
    const found = users.value.find((u) => u.id === selectedId.value)
    if (found) selectedRole.value = found.role
  }
})
</script>
