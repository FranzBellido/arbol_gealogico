<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-20">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-shield-check" class="text-amber-500 w-8 h-8" />
        <div>
          <h1 class="text-lg font-bold text-white leading-tight">Panel de Administración</h1>
          <p class="text-xs text-gray-400">Control de accesos y permisos globales</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          to="/"
        >
          Volver al Árbol
        </UButton>
      </div>
    </header>

    <!-- Main Container -->
    <main class="flex-grow p-6 max-w-6xl w-full mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-white">Usuarios de la plataforma</h2>
        <span class="text-sm text-gray-400">{{ users.length }} usuarios registrados</span>
      </div>

      <UCard class="bg-gray-900 border-gray-800 shadow-xl" :ui="{ body: { padding: 'p-0' } }">
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 space-y-3">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 w-10 h-10" />
          <p class="text-gray-400 text-sm">Cargando lista de usuarios...</p>
        </div>

        <div v-else-if="users.length === 0" class="text-center py-12 text-gray-400">
          No hay ningún usuario registrado.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-gray-900/50">
                <th class="py-4 px-6">Usuario</th>
                <th class="py-4 px-6">Email</th>
                <th class="py-4 px-6">Rol de Sistema</th>
                <th class="py-4 px-6">Estado de Aprobación</th>
                <th class="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/50">
              <tr v-for="u in users" :key="u.id" class="hover:bg-gray-800/20 transition-colors duration-150">
                <td class="py-4 px-6 flex items-center gap-3">
                  <UAvatar :src="u.avatar || ''" :alt="u.name" size="sm" />
                  <span class="font-medium text-white">{{ u.name || 'Sin Nombre' }}</span>
                </td>
                <td class="py-4 px-6 text-gray-300">
                  {{ u.email }}
                </td>
                <td class="py-4 px-6">
                  <UBadge
                    :color="u.systemRole === 'ADMIN' ? 'amber' : 'gray'"
                    variant="soft"
                  >
                    {{ u.systemRole }}
                  </UBadge>
                </td>
                <td class="py-4 px-6">
                  <UBadge
                    :color="u.isApproved ? 'green' : 'red'"
                    variant="soft"
                  >
                    {{ u.isApproved ? 'Aprobado' : 'Pendiente' }}
                  </UBadge>
                </td>
                <td class="py-4 px-6 text-right">
                  <!-- Don't allow changing approval status of oneself -->
                  <div v-if="u.id === auth.user?.id" class="text-xs text-gray-500 italic pr-2">
                    Tu Cuenta
                  </div>
                  <div v-else class="flex justify-end gap-2">
                    <UButton
                      v-if="!u.isApproved"
                      color="green"
                      size="xs"
                      variant="soft"
                      icon="i-heroicons-check"
                      :loading="actionLoadingId === u.id"
                      @click="toggleApproval(u.id, true)"
                    >
                      Aprobar
                    </UButton>
                    <UButton
                      v-else
                      color="red"
                      size="xs"
                      variant="soft"
                      icon="i-heroicons-x-mark"
                      :loading="actionLoadingId === u.id"
                      @click="toggleApproval(u.id, false)"
                    >
                      Suspender
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

definePageMeta({
  layout: false
})

const auth = useAuthStore()
const toast = useToast()

const users = ref([])
const loading = ref(false)
const actionLoadingId = ref(null)

async function fetchUsers() {
  loading.value = true
  try {
    const data = await auth.apiFetch('/users')
    users.value = data
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo cargar la lista de usuarios.', color: 'red' })
  } finally {
    loading.value = false
  }
}

async function toggleApproval(userId, newStatus) {
  actionLoadingId.value = userId
  try {
    await auth.apiFetch(`/users/${userId}/approve`, {
      method: 'PATCH',
      body: { isApproved: newStatus }
    })
    toast.add({
      title: 'Éxito',
      description: newStatus ? 'Usuario aprobado correctamente' : 'Acceso suspendido correctamente',
      color: 'green'
    })
    // Update locally
    const userIndex = users.value.findIndex(u => u.id === userId)
    if (userIndex !== -1) {
      users.value[userIndex].isApproved = newStatus
    }
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo actualizar el estado de aprobación.', color: 'red' })
  } finally {
    actionLoadingId.value = null
  }
}

onMounted(() => {
  fetchUsers()
})
</script>
