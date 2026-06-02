const hasWindow = typeof window !== 'undefined'

export function getUserId() {
  if (!hasWindow) return null
  return localStorage.getItem('selectedUserId') || null
}

export function setUserId(id) {
  if (!hasWindow) return
  localStorage.setItem('selectedUserId', id)
}

export function getRole() {
  if (!hasWindow) return null
  return localStorage.getItem('selectedRole') || null
}

export function setRole(role) {
  if (!hasWindow) return
  localStorage.setItem('selectedRole', role)
}

export function setSession({ id, role }) {
  setUserId(id)
  setRole(role)
}

export function clearSession() {
  if (!hasWindow) return
  localStorage.removeItem('selectedUserId')
  localStorage.removeItem('selectedRole')
}
