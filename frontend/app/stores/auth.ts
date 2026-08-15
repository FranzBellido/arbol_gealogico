import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(null)
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  // Load from localStorage on client side
  if (process.client) {
    token.value = localStorage.getItem('gt_token')
    const savedUser = localStorage.getItem('gt_user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const isAuthenticated = computed(() => !!token.value)
  const isApproved = computed(() => user.value?.isApproved === true || user.value?.systemRole === 'ADMIN')
  const isAdmin = computed(() => user.value?.systemRole === 'ADMIN')

  async function devLogin(email: string, name: string) {
    const data: any = await $fetch(`${apiBase}/auth/dev-login`, {
      method: 'POST',
      body: { email, name }
    })
    token.value = data.access_token
    user.value = data.user
    if (process.client) {
      localStorage.setItem('gt_token', data.access_token)
      localStorage.setItem('gt_user', JSON.stringify(data.user))
    }
    navigateTo('/')
  }

  function logout() {
    token.value = null
    user.value = null
    if (process.client) {
      localStorage.removeItem('gt_token')
      localStorage.removeItem('gt_user')
    }
    navigateTo('/login')
  }

  async function loginWithToken(tokenValue: string) {
    token.value = tokenValue
    if (process.client) {
      localStorage.setItem('gt_token', tokenValue)
    }
    try {
      const profileData: any = await apiFetch('/auth/profile')
      user.value = profileData
      if (process.client) {
        localStorage.setItem('gt_user', JSON.stringify(profileData))
      }
      navigateTo('/')
    } catch (e) {
      console.error('Failed to retrieve user profile', e)
      logout()
      throw e
    }
  }

  // A fetch wrapper that appends Auth headers
  async function apiFetch(path: string, options: any = {}) {
    const headers = { ...options.headers }
    if (token.value) {
      headers['Authorization'] = `Bearer ${token.value}`
    }
    return $fetch(`${apiBase}${path}`, {
      ...options,
      headers
    })
  }

  return {
    user,
    token,
    isAuthenticated,
    isApproved,
    isAdmin,
    devLogin,
    loginWithToken,
    logout,
    apiFetch
  }
}
)
