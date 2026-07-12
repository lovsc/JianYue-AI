import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem('current_user')) } catch { return null }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('access_token'))
  const user = ref(readStoredUser())
  const isAuthenticated = computed(() => Boolean(token.value))

  function saveSession(session) {
    token.value = session.token
    user.value = session.user
    localStorage.setItem('access_token', session.token)
    localStorage.setItem('current_user', JSON.stringify(session.user))
  }

  async function submit(credentials, mode = 'login') {
    const response = mode === 'login'
      ? await authApi.login(credentials)
      : await authApi.register(credentials)
    saveSession(response.data.data)
    return response.data
  }

  async function restoreSession() {
    if (!token.value) return false
    try {
      const response = await authApi.getCurrentUser()
      user.value = response.data.data.user
      localStorage.setItem('current_user', JSON.stringify(user.value))
      return true
    } catch {
      logout()
      return false
    }
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('current_user')
  }

  function setUser(nextUser) {
    user.value = nextUser
    localStorage.setItem('current_user', JSON.stringify(nextUser))
  }

  return { token, user, isAuthenticated, submit, restoreSession, logout, setUser }
})
