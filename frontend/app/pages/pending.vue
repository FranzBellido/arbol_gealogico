<template>
  <div class="min-h-screen flex items-center justify-center bg-radial-gradient from-gray-900 via-gray-950 to-black relative overflow-hidden px-4">
    <!-- Abstract premium background elements -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl"></div>

    <div class="w-full max-w-md bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl relative z-10 text-center">
      <div class="mb-6 flex justify-center">
        <div class="p-4 bg-amber-500/10 rounded-full text-amber-500 border border-amber-500/20 animate-pulse">
          <UIcon name="i-heroicons-clock" class="w-12 h-12" />
        </div>
      </div>

      <h1 class="text-3xl font-bold text-white tracking-tight">¡Bienvenido a GeneaTree!</h1>
      
      <p class="text-gray-300 mt-4 text-sm leading-relaxed">
        Tu cuenta <strong>{{ auth.user?.email }}</strong> ha sido registrada con éxito.
      </p>
      
      <p class="text-gray-400 mt-3 text-sm leading-relaxed">
        Por defecto, los nuevos usuarios no tienen permitido el ingreso. Un administrador debe autorizar tu acceso antes de que puedas comenzar a construir o ver árboles genealógicos.
      </p>

      <div class="mt-8 p-4 bg-gray-950/50 border border-gray-800/80 rounded-xl flex items-center gap-3 text-left">
        <UIcon name="i-heroicons-information-circle" class="text-amber-500 w-5 h-5 flex-shrink-0" />
        <span class="text-xs text-gray-400">
          Por favor, ponte en contacto con el administrador de la plataforma para solicitar la aprobación.
        </span>
      </div>

      <div class="mt-8 flex flex-col gap-3">
        <UButton
          color="primary"
          variant="solid"
          block
          size="lg"
          :loading="checking"
          icon="i-heroicons-arrow-path"
          @click="checkStatus"
        >
          Verificar Estado
        </UButton>

        <UButton
          color="red"
          variant="ghost"
          block
          size="lg"
          icon="i-heroicons-arrow-left-on-rectangle"
          @click="auth.logout()"
        >
          Cerrar Sesión
        </UButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

definePageMeta({
  layout: false
})

const auth = useAuthStore()
const checking = ref(false)
const toast = useToast()

async function checkStatus() {
  checking.value = true
  try {
    const profileData = await auth.apiFetch('/auth/profile')
    auth.user = profileData
    if (process.client) {
      localStorage.setItem('gt_user', JSON.stringify(profileData))
    }
    
    if (auth.isApproved) {
      toast.add({ title: '¡Aprobado!', description: 'Tu cuenta ha sido aprobada. Redirigiendo...', color: 'green' })
      navigateTo('/')
    } else {
      toast.add({ title: 'Pendiente', description: 'Tu cuenta sigue en espera de aprobación.', color: 'amber' })
    }
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo verificar el estado de la cuenta.', color: 'red' })
  } finally {
    checking.value = false
  }
}
</script>
