<template>
  <div class="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
    <!-- Header -->
    <header class="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-users" class="text-primary-500 w-6 h-6 sm:w-8 sm:h-8" />
        <div>
          <h1 class="text-base sm:text-lg font-bold text-white leading-tight">Gestión de Personas</h1>
          <p class="hidden sm:block text-xs text-gray-400">Administra los familiares de tu árbol</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
        <!-- Selector de árbol -->
        <USelect
          v-model="selectedTreeId"
          :options="treeOptions"
          option-attribute="label"
          value-attribute="value"
          placeholder="Seleccionar árbol..."
          class="min-w-[150px] sm:min-w-[220px] flex-grow sm:flex-grow-0"
        />

        <UButton
          v-if="currentTreePermission.canWrite"
          color="primary"
          variant="soft"
          icon="i-heroicons-user-plus"
          @click="openAddPersonModal"
          class="flex-shrink-0"
        >
          <span class="hidden sm:inline">Agregar Familiar</span>
        </UButton>

        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-share"
          to="/"
          class="flex-shrink-0"
        >
          <span class="hidden sm:inline">Ver Árbol</span>
        </UButton>

        <!-- Badge de solo lectura -->
        <UBadge v-if="!currentTreePermission.canWrite && selectedTreeId" color="amber" variant="soft" class="gap-1">
          <UIcon name="i-heroicons-lock-closed" class="w-3 h-3" />
          Solo lectura
        </UBadge>

        <!-- Desktop avatar & logout -->
        <div class="hidden sm:flex items-center gap-2 border-l border-gray-800 pl-4">
          <UAvatar :src="auth.user?.avatar || ''" :alt="auth.user?.name" size="sm" />
          <span class="text-sm font-medium text-gray-300">{{ auth.user?.name }}</span>
          <UButton
            icon="i-heroicons-arrow-left-on-rectangle"
            size="sm"
            color="red"
            variant="ghost"
            @click="auth.logout()"
          />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-5">
      <!-- Stats Cards -->
      <div v-if="selectedTreeId && !loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-users" class="text-primary-400 w-5 h-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ persons.length }}</p>
            <p class="text-xs text-gray-400">Total</p>
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-heart" class="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ persons.filter(p => p.isLiving).length }}</p>
            <p class="text-xs text-gray-400">Vivos</p>
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="text-blue-400 w-5 h-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ persons.filter(p => p.gender === 'MALE').length }}</p>
            <p class="text-xs text-gray-400">Masculino</p>
          </div>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
            <UIcon name="i-heroicons-user" class="text-pink-400 w-5 h-5" />
          </div>
          <div>
            <p class="text-2xl font-bold text-white">{{ persons.filter(p => p.gender === 'FEMALE').length }}</p>
            <p class="text-xs text-gray-400">Femenino</p>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <UCard v-if="selectedTreeId" class="bg-gray-900 border-gray-800" :ui="{ body: { padding: 'p-3 sm:p-4' } }">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Buscar por nombre o apellido..."
            class="flex-grow"
            :ui="{ icon: { trailing: { pointer: '' } } }"
          >
            <template #trailing>
              <UButton
                v-show="searchQuery"
                color="gray"
                variant="link"
                icon="i-heroicons-x-mark-20-solid"
                :padded="false"
                @click="searchQuery = ''"
              />
            </template>
          </UInput>

          <div class="flex items-center gap-2 flex-wrap">
            <USelect
              v-model="filterGender"
              :options="genderFilterOptions"
              option-attribute="label"
              value-attribute="value"
              placeholder="Género"
              class="min-w-[130px]"
            />

            <USelect
              v-model="filterVitalStatus"
              :options="vitalStatusOptions"
              option-attribute="label"
              value-attribute="value"
              placeholder="Estado"
              class="min-w-[130px]"
            />

            <UButton
              color="primary"
              variant="soft"
              icon="i-heroicons-arrow-path"
              size="sm"
              @click="loadTree"
              :loading="loading"
            >
              Refrescar
            </UButton>

            <UButton
              v-if="hasActiveFilters"
              color="gray"
              variant="ghost"
              icon="i-heroicons-funnel"
              size="sm"
              @click="clearFilters"
            >
              Limpiar
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-3">
        <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 w-10 h-10" />
        <p class="text-gray-400 text-sm">Cargando personas...</p>
      </div>

      <!-- Empty state: sin árbol seleccionado -->
      <div v-else-if="!selectedTreeId" class="flex flex-col items-center justify-center py-20 gap-4">
        <UIcon name="i-heroicons-users" class="text-gray-700 w-20 h-20" />
        <p class="text-gray-500 text-lg font-medium">Selecciona un árbol para ver las personas</p>
      </div>

      <!-- Empty state: sin personas -->
      <div v-else-if="persons.length === 0" class="flex flex-col items-center justify-center py-20 gap-4">
        <UIcon name="i-heroicons-user-plus" class="text-gray-700 w-16 h-16" />
        <p class="text-gray-500 text-lg font-medium">No hay personas en este árbol</p>
        <UButton v-if="currentTreePermission.canWrite" color="primary" icon="i-heroicons-plus" @click="openAddPersonModal">
          Agregar Primera Persona
        </UButton>
      </div>

      <!-- Table -->
      <UCard v-else class="bg-gray-900 border-gray-800 shadow-xl" :ui="{ body: { padding: 'p-0' } }">
        <div v-if="filteredPersons.length === 0" class="text-center py-12 text-gray-400">
          <UIcon name="i-heroicons-magnifying-glass" class="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p class="font-medium">No se encontraron resultados</p>
          <p class="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-gray-800 text-gray-400 text-xs font-semibold uppercase tracking-wider bg-gray-900/50">
                <th class="py-4 px-4 sm:px-6">Persona</th>
                <th class="py-4 px-4 sm:px-6 hidden md:table-cell">Género</th>
                <th class="py-4 px-4 sm:px-6 hidden sm:table-cell">Estado</th>
                <th class="py-4 px-4 sm:px-6 hidden lg:table-cell">Cumpleaños</th>
                <th class="py-4 px-4 sm:px-6 hidden xl:table-cell">Padres</th>
                <th class="py-4 px-4 sm:px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-800/50">
              <tr
                v-for="person in paginatedPersons"
                :key="person.id"
                class="hover:bg-gray-800/30 transition-colors duration-150 cursor-pointer"
                @click="openViewPersonModal(person)"
              >
                <!-- Persona -->
                <td class="py-3 px-4 sm:px-6">
                  <div class="flex items-center gap-3">
                    <UAvatar
                      :src="person.avatarUrl || ''"
                      :alt="person.firstName"
                      size="sm"
                      :ui="{
                        background: person.gender === 'MALE' ? 'bg-blue-900/50' : person.gender === 'FEMALE' ? 'bg-pink-900/50' : 'bg-gray-800'
                      }"
                      :class="[
                        'border',
                        person.gender === 'MALE' ? 'border-blue-500/50' : person.gender === 'FEMALE' ? 'border-pink-500/50' : 'border-purple-500/50'
                      ]"
                    />
                    <div>
                      <div class="font-medium text-white text-sm">
                        {{ person.firstName }} {{ person.lastName }}
                        <span v-if="person.lastName2" class="text-gray-400">{{ person.lastName2 }}</span>
                      </div>
                      <div v-if="person.maidenName" class="text-xs text-gray-500 italic">(née: {{ person.maidenName }})</div>
                      <!-- Mobile: show gender and status inline -->
                      <div class="flex items-center gap-1.5 mt-1 sm:hidden">
                        <UBadge :color="person.gender === 'MALE' ? 'blue' : person.gender === 'FEMALE' ? 'pink' : 'purple'" variant="subtle" size="xs">
                          {{ person.gender === 'MALE' ? 'M' : person.gender === 'FEMALE' ? 'F' : 'O' }}
                        </UBadge>
                        <UBadge :color="person.isLiving ? 'emerald' : 'gray'" variant="subtle" size="xs">
                          {{ person.isLiving ? 'Vivo' : 'Fallecido' }}
                        </UBadge>
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Género -->
                <td class="py-3 px-4 sm:px-6 hidden md:table-cell">
                  <UBadge
                    :color="person.gender === 'MALE' ? 'blue' : person.gender === 'FEMALE' ? 'pink' : 'purple'"
                    variant="subtle"
                    class="capitalize"
                  >
                    {{ person.gender === 'MALE' ? 'Masculino' : person.gender === 'FEMALE' ? 'Femenino' : 'Otro' }}
                  </UBadge>
                </td>

                <!-- Estado -->
                <td class="py-3 px-4 sm:px-6 hidden sm:table-cell">
                  <div class="flex items-center gap-2">
                    <UBadge :color="person.isLiving ? 'emerald' : 'gray'" variant="subtle">
                      {{ person.isLiving ? 'Vivo/a' : 'Fallecido/a' }}
                    </UBadge>
                    <UBadge v-if="person.isLocked" color="amber" variant="subtle" size="xs">
                      <UIcon name="i-heroicons-lock-closed" class="w-3 h-3" />
                    </UBadge>
                  </div>
                </td>

                <!-- Cumpleaños -->
                <td class="py-3 px-4 sm:px-6 hidden lg:table-cell">
                  <div v-if="person.birthDate" class="flex items-center gap-1.5">
                    <UIcon name="i-heroicons-cake" class="w-4 h-4 text-primary-400" />
                    <span class="text-sm text-gray-200">{{ formatBirthday(person.birthDate) }}</span>
                  </div>
                  <span v-else class="text-xs text-gray-600 italic">—</span>
                </td>

                <!-- Padres -->
                <td class="py-3 px-4 sm:px-6 hidden xl:table-cell">
                  <div class="space-y-0.5">
                    <div v-if="getPersonName(person.fatherId)" class="text-xs text-blue-400">
                      <UIcon name="i-heroicons-user" class="w-3 h-3 inline mr-1" />{{ getPersonName(person.fatherId) }}
                    </div>
                    <div v-if="getPersonName(person.motherId)" class="text-xs text-pink-400">
                      <UIcon name="i-heroicons-user" class="w-3 h-3 inline mr-1" />{{ getPersonName(person.motherId) }}
                    </div>
                    <span v-if="!getPersonName(person.fatherId) && !getPersonName(person.motherId)" class="text-xs text-gray-600 italic">—</span>
                  </div>
                </td>

                <!-- Acciones -->
                <td class="py-3 px-4 sm:px-6 text-right" @click.stop>
                  <div class="flex justify-end gap-1">
                    <UButton
                      color="gray"
                      variant="ghost"
                      icon="i-heroicons-eye"
                      size="xs"
                      @click="openViewPersonModal(person)"
                    />
                    <UButton
                      v-if="currentTreePermission.canWrite && !person.isLocked"
                      color="primary"
                      variant="ghost"
                      icon="i-heroicons-pencil-square"
                      size="xs"
                      @click="openEditPersonModal(person)"
                    />
                    <UButton
                      v-if="currentTreePermission.canWrite && !person.isLocked"
                      color="red"
                      variant="ghost"
                      icon="i-heroicons-trash"
                      size="xs"
                      @click="confirmDelete(person)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-gray-800 px-4 sm:px-6 py-3">
          <span class="text-xs text-gray-400">
            Mostrando {{ paginationStart + 1 }}–{{ paginationEnd }} de {{ filteredPersons.length }}
          </span>
          <div class="flex items-center gap-1">
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-chevron-left"
              size="xs"
              :disabled="currentPage === 1"
              @click="currentPage--"
            />
            <template v-for="page in visiblePages" :key="page">
              <UButton
                v-if="page !== '...'"
                :color="page === currentPage ? 'primary' : 'gray'"
                :variant="page === currentPage ? 'soft' : 'ghost'"
                size="xs"
                class="min-w-[32px]"
                @click="currentPage = page"
              >
                {{ page }}
              </UButton>
              <span v-else class="text-gray-500 px-1">…</span>
            </template>
            <UButton
              color="gray"
              variant="ghost"
              icon="i-heroicons-chevron-right"
              size="xs"
              :disabled="currentPage === totalPages"
              @click="currentPage++"
            />
          </div>
        </div>
      </UCard>
    </main>

    <!-- Reused Modals -->
    <PersonFormModal
      v-model="isPersonModalOpen"
      :person="selectedPerson"
      :persons-list="persons"
      :is-locked="selectedPerson?.isLocked || false"
      :can-admin="currentTreePermission.isAdmin"
      @save="handleSavePerson"
      @delete="handleDeletePerson"
      @toggle-lock="handleToggleLock"
    />

    <PersonDetailModal
      v-model="isDetailModalOpen"
      :person="selectedPerson"
      :persons-list="persons"
      :can-edit="currentTreePermission.canWrite"
      @edit="openEditPersonModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import PersonDetailModal from '../components/PersonDetailModal.vue'

const auth = useAuthStore()
const toast = useToast()

// ─── State ──────────────────────────────────────────────────
const loading = ref(false)
const persons = ref([])
const trees = ref([])
const selectedTreeId = ref('')
const currentTreePermission = ref({ level: null, isAdmin: false, canWrite: false })

// Modal states
const isPersonModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const selectedPerson = ref(null)

// Filters
const searchQuery = ref('')
const filterGender = ref('')
const filterVitalStatus = ref('')
const currentPage = ref(1)
const pageSize = 10

const genderFilterOptions = [
  { label: 'Todos los géneros', value: '' },
  { label: 'Masculino', value: 'MALE' },
  { label: 'Femenino', value: 'FEMALE' },
  { label: 'Otro', value: 'OTHER' }
]

const vitalStatusOptions = [
  { label: 'Todos los estados', value: '' },
  { label: 'Vivos', value: 'living' },
  { label: 'Fallecidos', value: 'deceased' }
]

const hasActiveFilters = computed(() => searchQuery.value || filterGender.value || filterVitalStatus.value)

// ─── Tree selector options ───────────────────────────────────
const treeOptions = computed(() => {
  return trees.value.map(t => ({
    label: t.role === 'OWNER'
      ? `${t.name} (mi árbol)`
      : `${t.name} — ${t.owner?.name || t.owner?.email || 'Compartido'}`,
    value: t.id
  }))
})

// ─── Filtered & Paginated ─────────────────────────────────────
const filteredPersons = computed(() => {
  let result = [...persons.value]

  // Search filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p =>
      `${p.firstName} ${p.lastName} ${p.lastName2 || ''} ${p.maidenName || ''}`.toLowerCase().includes(q)
    )
  }

  // Gender filter
  if (filterGender.value) {
    result = result.filter(p => p.gender === filterGender.value)
  }

  // Vital status filter
  if (filterVitalStatus.value === 'living') {
    result = result.filter(p => p.isLiving)
  } else if (filterVitalStatus.value === 'deceased') {
    result = result.filter(p => !p.isLiving)
  }

  // Sort alphabetically
  result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))

  return result
})

const totalPages = computed(() => Math.ceil(filteredPersons.value.length / pageSize))
const paginationStart = computed(() => (currentPage.value - 1) * pageSize)
const paginationEnd = computed(() => Math.min(paginationStart.value + pageSize, filteredPersons.value.length))
const paginatedPersons = computed(() => filteredPersons.value.slice(paginationStart.value, paginationEnd.value))

const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = []
  pages.push(1)
  if (current > 3) pages.push('...')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
})

// Reset page when filters change
watch([searchQuery, filterGender, filterVitalStatus], () => {
  currentPage.value = 1
})

// ─── Helper functions ────────────────────────────────────────
function getPersonName(personId) {
  if (!personId) return null
  const p = persons.value.find(x => x.id === personId)
  return p ? `${p.firstName} ${p.lastName}` : null
}

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(d)
  } catch (e) {
    return dateString
  }
}

function formatBirthday(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC'
    }).format(d)
  } catch (e) {
    return dateString
  }
}

function clearFilters() {
  searchQuery.value = ''
  filterGender.value = ''
  filterVitalStatus.value = ''
}

// ─── Load trees list ─────────────────────────────────────────
async function loadTrees() {
  try {
    const data = await auth.apiFetch('/tree/list')
    trees.value = data || []

    if (!selectedTreeId.value && trees.value.length > 0) {
      const myTree = trees.value.find(t => t.role === 'OWNER')
      selectedTreeId.value = myTree?.id || trees.value[0]?.id || ''
    }
  } catch (error) {
    console.error('Error al cargar árboles:', error)
  }
}

// ─── Load tree data ──────────────────────────────────────────
async function loadTree() {
  if (!auth.isAuthenticated || !selectedTreeId.value) return
  loading.value = true
  try {
    const data = await auth.apiFetch(`/tree?treeId=${selectedTreeId.value}`)
    persons.value = data.persons || []

    if (data.permission) {
      currentTreePermission.value = data.permission
    }
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo cargar las personas', color: 'red' })
  } finally {
    loading.value = false
  }
}

watch(selectedTreeId, () => {
  if (selectedTreeId.value) loadTree()
})

onMounted(async () => {
  await loadTrees()
  if (selectedTreeId.value) loadTree()
})

// ─── CRUD actions ─────────────────────────────────────────────
function openAddPersonModal() {
  selectedPerson.value = null
  isPersonModalOpen.value = true
}

function openViewPersonModal(person) {
  selectedPerson.value = person
  isDetailModalOpen.value = true
}

function openEditPersonModal(person) {
  selectedPerson.value = person
  isPersonModalOpen.value = true
}

async function handleSavePerson(formData) {
  try {
    const isEdit = !!formData.id
    const payload = { ...formData, treeId: selectedTreeId.value }

    if (isEdit) {
      await auth.apiFetch(`/tree/person/${formData.id}`, { method: 'PUT', body: payload })
    } else {
      await auth.apiFetch('/tree/person', { method: 'POST', body: payload })
    }

    toast.add({ title: 'Éxito', description: 'Datos guardados correctamente', color: 'green' })
    loadTree()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: error?.data?.message || 'No se pudieron guardar los datos', color: 'red' })
  }
}

async function handleDeletePerson(personId) {
  try {
    await auth.apiFetch(`/tree/person/${personId}`, { method: 'DELETE' })
    toast.add({ title: 'Éxito', description: 'Persona eliminada', color: 'green' })
    loadTree()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: error?.data?.message || 'No se pudo eliminar a la persona', color: 'red' })
  }
}

function confirmDelete(person) {
  if (confirm(`¿Estás seguro de que deseas eliminar a ${person.firstName} ${person.lastName}?`)) {
    handleDeletePerson(person.id)
  }
}

async function handleToggleLock(personId, locked) {
  try {
    await auth.apiFetch(`/tree/person/${personId}/lock`, { method: 'PATCH', body: { locked } })
    toast.add({
      title: locked ? '🔒 Bloqueado' : '🔓 Desbloqueado',
      description: locked ? 'El registro ahora es de solo lectura' : 'El registro puede editarse',
      color: locked ? 'amber' : 'green'
    })
    loadTree()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo cambiar el estado de bloqueo', color: 'red' })
  }
}
</script>

<style scoped>
table {
  border-spacing: 0;
}
</style>
