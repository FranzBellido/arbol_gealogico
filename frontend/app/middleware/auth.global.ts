import { useAuthStore } from '../stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()

  // 1. If user is NOT logged in, they can only access /login
  if (!auth.isAuthenticated) {
    if (to.path !== '/login') {
      return navigateTo('/login')
    }
    return
  }

  // 2. If user IS logged in but NOT approved, they can only access /pending
  if (!auth.isApproved) {
    if (to.path !== '/pending') {
      return navigateTo('/pending')
    }
    return
  }

  // 3. If user IS approved, they shouldn't access /pending or /login
  if (to.path === '/pending' || to.path === '/login') {
    return navigateTo('/')
  }

  // 4. If user wants to access /admin, they must be an ADMIN
  if (to.path === '/admin' && !auth.isAdmin) {
    return navigateTo('/')
  }
})
