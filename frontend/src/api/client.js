import { getUserId } from '../lib/session.js'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export async function apiFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const reqHeaders = { ...headers }

  if (body !== undefined) {
    reqHeaders['Content-Type'] = 'application/json'
  }

  const userId = getUserId()
  if (userId) {
    reqHeaders['X-User-Id'] = userId
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  let json
  try {
    json = await res.json()
  } catch {
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`)
      err.status = res.status
      err.code = 'PARSE_ERROR'
      throw err
    }
    return undefined
  }

  if (!res.ok || json.ok === false) {
    // 백엔드 오류 형식: { ok:false, error:{ code, message, details? } }
    const errObj = json?.error ?? {}
    const err = new Error(errObj.message || `HTTP ${res.status}`)
    err.status = res.status
    err.code = errObj.code || 'API_ERROR'
    err.details = errObj.details
    throw err
  }

  return json.data !== undefined ? json.data : json
}

export const api = {
  get: (path, opts = {}) => apiFetch(path, { ...opts, method: 'GET' }),
  post: (path, body, opts = {}) => apiFetch(path, { ...opts, method: 'POST', body }),
  patch: (path, body, opts = {}) => apiFetch(path, { ...opts, method: 'PATCH', body }),
  del: (path, opts = {}) => apiFetch(path, { ...opts, method: 'DELETE' }),
}
