// src/stores/auth.js
import { reactive, computed } from 'vue'

const LS_KEY = 'auth_user_v1'

const state = reactive({
  user: null // { id, name, email, role, dept, avatarUrl? }
})

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) state.user = JSON.parse(raw)
  } catch {}
}
load()

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state.user))
}

function login(mockProfile) {
  // 在這裡串接你的後端登入流程；這裡先放示範。
  state.user = mockProfile
  save()
}

function logout() {
  state.user = null
  localStorage.removeItem(LS_KEY)
}

const isAuthed = computed(() => !!state.user)
const initials = computed(() => {
  if (!state.user?.name) return '?'
  const parts = state.user.name.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts[1]?.[0] || ''
  return (first + last || first).toUpperCase()
})

export default { state, isAuthed, login, logout, initials }