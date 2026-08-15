<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-white">
            Compartir Árbol Genealógico
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <div class="space-y-6">
        <!-- Add permission form -->
        <form @submit.prevent="grantAccess" class="space-y-4">
          <UFormGroup label="Correo del usuario" required>
            <UInput v-model="email" type="email" placeholder="usuario@ejemplo.com" required />
          </UFormGroup>

          <UButton type="submit" color="primary" block icon="i-heroicons-user-plus" :loading="granting">
            Otorgar Acceso
          </UButton>
        </form>

        <!-- Current Access list -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-300">Usuarios con acceso:</h4>

          <div v-if="loading" class="text-center py-4">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-gray-500 w-6 h-6" />
          </div>

          <div v-else-if="accesses.length === 0" class="text-xs text-gray-500 text-center py-4 border border-dashed border-gray-800 rounded">
            Nadie más tiene acceso a este árbol.
          </div>

          <ul v-else class="divide-y divide-gray-800 border border-gray-800 rounded-lg overflow-hidden">
            <li v-for="access in accesses" :key="access.id_tree + access.id_user" class="flex items-center justify-between p-3 bg-gray-900/50">
              <div class="flex items-center gap-3">
                <UAvatar :src="access.user?.avatar || ''" :alt="access.user?.name" size="xs" />
                <div>
                  <p class="text-sm font-medium text-white">{{ access.user?.name || 'Usuario' }}</p>
                  <p class="text-xs text-gray-400">{{ access.user?.email }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UBadge v-if="access.user?.is_admin" color="amber" variant="subtle" size="xs">
                  Admin
                </UBadge>
                <UBadge color="green" variant="subtle" size="xs">
                  Acceso
                </UBadge>
                <UButton
                  icon="i-heroicons-trash"
                  size="xs"
                  color="red"
                  variant="ghost"
                  @click="revokeAccess(access.id_user)"
                />
              </div>
            </li>
          </ul>
        </div>
      </div>
    </UCard>
  </UModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  modelValue: Boolean,
  treeId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const auth = useAuthStore()
const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const email = ref('')
const accesses = ref([])
const loading = ref(false)
const granting = ref(false)

async function fetchAccesses() {
  if (!isOpen.value || !props.treeId) return
  loading.value = true
  try {
    accesses.value = await auth.apiFetch(`/users/tree-access?treeId=${props.treeId}`)
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

watch(isOpen, (val) => { if (val) fetchAccesses() })
watch(() => props.treeId, () => { if (isOpen.value) fetchAccesses() })

async function grantAccess() {
  if (!email.value) return
  granting.value = true
  try {
    await auth.apiFetch('/users/tree-access', {
      method: 'POST',
      body: { treeId: props.treeId, email: email.value }
    })
    toast.add({ title: 'Éxito', description: 'Acceso otorgado correctamente', color: 'green' })
    email.value = ''
    fetchAccesses()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: error?.data?.message || 'No se pudo otorgar acceso', color: 'red' })
  } finally {
    granting.value = false
  }
}

async function revokeAccess(userId) {
  if (!confirm('¿Estás seguro de que deseas revocar el acceso a este usuario?')) return
  try {
    await auth.apiFetch(`/users/tree-access/${userId}?treeId=${props.treeId}`, { method: 'DELETE' })
    toast.add({ title: 'Éxito', description: 'Acceso revocado correctamente', color: 'green' })
    fetchAccesses()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo revocar el acceso', color: 'red' })
  }
}
</script>
