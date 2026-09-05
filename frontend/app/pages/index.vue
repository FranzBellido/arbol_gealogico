<template>
  <div class="h-screen flex flex-col bg-gray-950 overflow-hidden">
    <!-- Navbar -->
    <header class="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-20">
      <div class="flex items-center justify-between w-full sm:w-auto">
        <div class="flex items-center gap-3">
          <UIcon name="i-heroicons-share" class="text-primary-500 w-6 h-6 sm:w-8 sm:h-8" />
          <div>
            <h1 class="text-base sm:text-lg font-bold text-white leading-tight">GeneaTree</h1>
            <p class="hidden sm:block text-xs text-gray-400">Árbol Genealógico Interactivo</p>
          </div>
        </div>
        <!-- Mobile avatar & logout (visible only on small screens) -->
        <div class="flex items-center gap-2 sm:hidden">
          <UAvatar :src="auth.user?.avatar || ''" :alt="auth.user?.name" size="sm" />
          <UButton
            icon="i-heroicons-arrow-left-on-rectangle"
            size="sm"
            color="red"
            variant="ghost"
            @click="auth.logout()"
          />
        </div>
      </div>

      <!-- Controls & Tree Selector -->
      <div class="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
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
          v-if="currentTreePermission.canWrite"
          color="pink"
          variant="soft"
          icon="i-heroicons-heart"
          @click="isUnionModalOpen = true"
          class="flex-shrink-0"
        >
          <span class="hidden sm:inline">Registrar Unión</span>
        </UButton>

        <!-- Solo admins del árbol pueden compartir -->
        <UButton
          v-if="currentTreePermission.isAdmin"
          color="gray"
          variant="ghost"
          icon="i-heroicons-share"
          @click="isShareModalOpen = true"
          class="flex-shrink-0"
        >
          <span class="hidden sm:inline">Compartir</span>
        </UButton>

        <!-- Badge de solo lectura -->
        <UBadge v-if="!currentTreePermission.canWrite && selectedTreeId" color="amber" variant="soft" class="gap-1">
          <UIcon name="i-heroicons-lock-closed" class="w-3 h-3" />
          Solo lectura
        </UBadge>

        <UButton
          v-if="auth.isAdmin"
          color="amber"
          variant="soft"
          icon="i-heroicons-shield-check"
          to="/admin"
          class="flex-shrink-0"
        >
          <span class="hidden sm:inline">Administrar</span>
        </UButton>

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

    <!-- Main Workspace with Vue Flow -->
    <main class="flex-1 relative">
      <!-- Loading -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-10">
        <div class="flex flex-col items-center gap-3">
          <UIcon name="i-heroicons-arrow-path" class="animate-spin text-primary-500 w-10 h-10" />
          <p class="text-gray-400 text-sm">Cargando árbol familiar...</p>
        </div>
      </div>

      <!-- Empty state: sin árbol seleccionado -->
      <div v-else-if="!selectedTreeId" class="absolute inset-0 flex flex-col items-center justify-center gap-4">
        <UIcon name="i-heroicons-share" class="text-gray-700 w-20 h-20" />
        <p class="text-gray-500 text-lg font-medium">Selecciona un árbol para comenzar</p>
        <p class="text-gray-600 text-sm">O crea tu primer árbol genealógico</p>
        <UButton color="primary" icon="i-heroicons-plus" @click="isCreateTreeModalOpen = true">
          Crear Árbol
        </UButton>
      </div>

      <VueFlow
        v-else
        v-model="elements"
        :node-types="nodeTypes"
        class="w-full h-full"
      >
        <Background pattern-color="#374151" :gap="16" />
        <Controls />
      </VueFlow>
    </main>

    <!-- Modals -->
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
      :can-edit="currentTreePermission.canWrite"
      @edit="openEditPersonModal"
    />

    <UnionFormModal
      v-model="isUnionModalOpen"
      :persons-list="persons"
      @save="handleSaveUnion"
    />

    <TreeAccessModal
      v-if="currentTreePermission.isAdmin && selectedTreeId"
      v-model="isShareModalOpen"
      :tree-id="selectedTreeId"
    />

    <!-- Modal: Crear nuevo árbol -->
    <UModal v-model="isCreateTreeModalOpen">
      <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-800' }">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold text-white">Crear Árbol Genealógico</h3>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="isCreateTreeModalOpen = false" />
          </div>
        </template>
        <form @submit.prevent="createTree" class="space-y-4">
          <UFormGroup label="Nombre del árbol" required>
            <UInput v-model="newTreeName" placeholder="Familia García..." required autofocus />
          </UFormGroup>
          <div class="flex justify-end gap-3 pt-2">
            <UButton color="gray" variant="ghost" @click="isCreateTreeModalOpen = false">Cancelar</UButton>
            <UButton type="submit" color="primary" icon="i-heroicons-plus" :loading="creatingTree">Crear</UButton>
          </div>
        </form>

      </UCard>
    </UModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { useAuthStore } from '../stores/auth'

// Import custom flow nodes
import CustomNode from '../components/CustomNode.vue'
import UnionNode from '../components/UnionNode.vue'
import PersonDetailModal from '../components/PersonDetailModal.vue'

// Import stylesheet of Vue Flow
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'

const auth = useAuthStore()
const toast = useToast()

const { onNodeDragStop, onMoveEnd, setViewport, fitView } = useVueFlow()

onNodeDragStop(({ node }) => {
  if (node) saveNodePosition(node.id, node.position)
})

onMoveEnd(({ viewport }) => {
  if (!selectedTreeId.value) return
  const key = `geneatree-viewport-${selectedTreeId.value}`
  localStorage.setItem(key, JSON.stringify(viewport))
})

onMounted(async () => {
  await loadTrees()
  if (selectedTreeId.value) loadTree()
})

// Node Registration
const nodeTypes = {
  person: CustomNode,
  union: UnionNode
}

// ─── State ──────────────────────────────────────────────────
const loading = ref(false)
const persons = ref([])
const unions = ref([])
const trees = ref([])         // Lista de árboles accesibles
const selectedTreeId = ref('') // Árbol seleccionado actualmente
const elements = ref([])

// Permiso del usuario sobre el árbol seleccionado
const currentTreePermission = ref({ level: null, isAdmin: false, canWrite: false })

// Modal states
const isPersonModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isUnionModalOpen = ref(false)
const isShareModalOpen = ref(false)
const isCreateTreeModalOpen = ref(false)
const selectedPerson = ref(null)
const newTreeName = ref('')
const creatingTree = ref(false)


// ─── Tree selector options ───────────────────────────────────
const treeOptions = computed(() => {
  return trees.value.map(t => ({
    label: t.role === 'OWNER'
      ? `${t.name} (mi árbol)`
      : `${t.name} — ${t.owner?.name || t.owner?.email || 'Compartido'}`,
    value: t.id
  }))
})

// ─── Load trees list ─────────────────────────────────────────
async function loadTrees() {
  try {
    const data = await auth.apiFetch('/tree/list')
    trees.value = data || []

    // Si no hay árbol seleccionado, seleccionar el primero propio
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
    unions.value = data.unions || []

    // Permiso del usuario sobre este árbol
    if (data.permission) {
      currentTreePermission.value = data.permission
    }

    generateTreeLayout()
    nextTick(() => restoreViewport())
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo cargar el árbol genealógico', color: 'red' })
  } finally {
    loading.value = false
  }
}

watch(selectedTreeId, () => {
  if (selectedTreeId.value) loadTree()
})

// ─── Create tree ─────────────────────────────────────────────
async function createTree() {
  if (!newTreeName.value.trim()) return
  creatingTree.value = true
  try {
    const tree = await auth.apiFetch('/tree/create', {
      method: 'POST',
      body: { name: newTreeName.value.trim() }
    })
    toast.add({ title: 'Árbol creado', description: `"${tree.name}" está listo`, color: 'green' })
    newTreeName.value = ''
    isCreateTreeModalOpen.value = false
    await loadTrees()
    selectedTreeId.value = tree.id
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo crear el árbol', color: 'red' })
  } finally {
    creatingTree.value = false
  }
}

// ─── Viewport & positions ────────────────────────────────────
function getSavedPositions() {
  if (!selectedTreeId.value) return {}
  const key = `geneatree-positions-${selectedTreeId.value}`
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : {}
  } catch (e) {
    return {}
  }
}

function saveNodePosition(nodeId, position) {
  if (!selectedTreeId.value) return
  const key = `geneatree-positions-${selectedTreeId.value}`
  try {
    const saved = localStorage.getItem(key)
    const positions = saved ? JSON.parse(saved) : {}
    positions[nodeId] = { x: position.x, y: position.y }
    localStorage.setItem(key, JSON.stringify(positions))
  } catch (e) {
    console.error('Error saving position', e)
  }
}

function restoreViewport() {
  if (!selectedTreeId.value) return
  const key = `geneatree-viewport-${selectedTreeId.value}`
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      setViewport(JSON.parse(saved))
    } else {
      fitView()
    }
  } catch (e) {
    fitView()
  }
}

// ─── Tree Layout ─────────────────────────────────────────────
function generateTreeLayout() {
  const nodes = []
  const edges = []
  const levels = {}

  persons.value.forEach(p => { levels[p.id] = 0 })

  let changed = true
  let iterations = 0
  while (changed && iterations < 50) {
    changed = false
    persons.value.forEach(p => {
      let maxParentLevel = -1
      if (p.fatherId && levels[p.fatherId] !== undefined) {
        maxParentLevel = Math.max(maxParentLevel, levels[p.fatherId])
      }
      if (p.motherId && levels[p.motherId] !== undefined) {
        maxParentLevel = Math.max(maxParentLevel, levels[p.motherId])
      }
      const newLevel = maxParentLevel + 1
      if (newLevel > levels[p.id]) {
        levels[p.id] = newLevel
        changed = true
      }
    })
    iterations++
  }

  const levelCounts = {}
  const personPositions = {}
  const savedPositions = getSavedPositions()

  persons.value.forEach(p => {
    const lvl = levels[p.id] || 0
    if (levelCounts[lvl] === undefined) levelCounts[lvl] = 0

    let posX = levelCounts[lvl] * 280
    let posY = lvl * 220

    if (savedPositions[p.id]) {
      posX = savedPositions[p.id].x
      posY = savedPositions[p.id].y
    }

    personPositions[p.id] = { x: posX, y: posY }
    levelCounts[lvl]++

    nodes.push({
      id: p.id,
      type: 'person',
      data: { ...p, isLocked: p.isLocked || false, canEdit: currentTreePermission.value.canWrite, canAdmin: currentTreePermission.value.isAdmin },
      position: { x: posX, y: posY },
      events: {
        click: () => openViewPersonModal(p),
        view: () => openViewPersonModal(p),
        edit: () => openEditPersonModal(p),
        delete: () => {
          if (confirm('¿Estás seguro de que deseas eliminar a esta persona?')) {
            handleDeletePerson(p.id)
          }
        }
      }
    })
  })

  unions.value.forEach(u => {
    const pos1 = personPositions[u.partner1Id]
    const pos2 = personPositions[u.partner2Id]

    if (pos1 && pos2) {
      let unionX = (pos1.x + pos2.x) / 2 + 100
      let unionY = (pos1.y + pos2.y) / 2 + 50

      if (savedPositions[`union-${u.id}`]) {
        unionX = savedPositions[`union-${u.id}`].x
        unionY = savedPositions[`union-${u.id}`].y
      }

      nodes.push({
        id: `union-${u.id}`,
        type: 'union',
        data: u,
        position: { x: unionX, y: unionY }
      })

      edges.push({
        id: `edge-${u.partner1Id}-${u.id}`,
        source: u.partner1Id,
        target: `union-${u.id}`,
        targetHandle: 'p1',
        animated: true,
        style: { stroke: '#ec4899', strokeWidth: 2 }
      })
      edges.push({
        id: `edge-${u.partner2Id}-${u.id}`,
        source: u.partner2Id,
        target: `union-${u.id}`,
        targetHandle: 'p2',
        animated: true,
        style: { stroke: '#ec4899', strokeWidth: 2 }
      })

      persons.value.forEach(child => {
        if (
          (child.fatherId === u.partner1Id && child.motherId === u.partner2Id) ||
          (child.fatherId === u.partner2Id && child.motherId === u.partner1Id)
        ) {
          edges.push({
            id: `edge-union-${u.id}-${child.id}`,
            source: `union-${u.id}`,
            sourceHandle: 'children',
            target: child.id,
            style: { stroke: '#10b981', strokeWidth: 2 }
          })
        }
      })
    }
  })

  // Fallback direct edges (no union)
  persons.value.forEach(child => {
    const hasUnionFather = unions.value.some(u =>
      (u.partner1Id === child.fatherId && u.partner2Id === child.motherId) ||
      (u.partner2Id === child.fatherId && u.partner1Id === child.motherId)
    )
    if (!hasUnionFather) {
      if (child.fatherId && personPositions[child.fatherId]) {
        edges.push({
          id: `edge-father-${child.fatherId}-${child.id}`,
          source: child.fatherId,
          target: child.id,
          style: { stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '4' }
        })
      }
      if (child.motherId && personPositions[child.motherId]) {
        edges.push({
          id: `edge-mother-${child.motherId}-${child.id}`,
          source: child.motherId,
          target: child.id,
          style: { stroke: '#ec4899', strokeWidth: 1.5, strokeDasharray: '4' }
        })
      }
    }
  })

  elements.value = [...nodes, ...edges]
}

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
    // Siempre incluir treeId en el payload
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

async function handleSaveUnion(formData) {
  try {
    await auth.apiFetch('/tree/union', { method: 'POST', body: formData })
    toast.add({ title: 'Éxito', description: 'Unión registrada correctamente', color: 'green' })
    loadTree()
  } catch (error) {
    console.error(error)
    toast.add({ title: 'Error', description: 'No se pudo registrar la unión', color: 'red' })
  }
}
</script>

<style>
/* Vue Flow custom styles */
.vue-flow__node {
  cursor: grab;
}
.vue-flow__node.selected {
  outline: 2px solid #3b82f6;
  border-radius: 12px;
}
.vue-flow__edge-path {
  stroke-dasharray: 5;
  animation: dash 30s linear infinite;
}
@keyframes dash {
  from { stroke-dashoffset: 1000; }
  to   { stroke-dashoffset: 0; }
}
</style>
