<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-800', background: 'bg-gray-900', shadow: 'shadow-2xl' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-white">Detalles del Familiar</h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <div v-if="person" class="space-y-6">
        <!-- Photo and Main Info Header -->
        <div class="flex flex-col sm:flex-row items-center gap-6">
          <!-- Avatar/Photo -->
          <UAvatar
            :src="person.avatarUrl || ''"
            :alt="person.firstName"
            size="3xl"
            class="border-4 shadow-lg shrink-0 w-32 h-32 text-4xl"
            :ui="{ 
              background: person.gender === 'MALE' ? 'bg-blue-900/50' : person.gender === 'FEMALE' ? 'bg-pink-900/50' : 'bg-gray-800'
            }"
            :class="[
              person.gender === 'MALE' ? 'border-blue-500/50' : person.gender === 'FEMALE' ? 'border-pink-500/50' : 'border-purple-500/50'
            ]"
          />

          <!-- Main Info -->
          <div class="flex-1 text-center sm:text-left">
            <h2 class="text-2xl font-bold text-white mb-1">
              {{ person.firstName }} {{ person.lastName }} {{ person.lastName2 || '' }}
            </h2>
            <p v-if="person.maidenName" class="text-sm text-gray-400 italic mb-2">
              (née: {{ person.maidenName }})
            </p>
            <div class="flex items-center justify-center sm:justify-start gap-2 text-sm">
              <UBadge :color="genderColor" variant="subtle" class="capitalize">
                {{ genderLabel }}
              </UBadge>
              <UBadge v-if="person.isLiving" color="emerald" variant="subtle">
                Vivo/a
              </UBadge>
              <UBadge v-else color="gray" variant="subtle">
                Fallecido/a
              </UBadge>
            </div>
          </div>
        </div>

        <UDivider class="border-gray-800" />

        <!-- Details Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Birth -->
          <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <div class="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
              <UIcon name="i-heroicons-cake" class="w-4 h-4" />
              Cumpleaños
            </div>
            <div class="text-gray-200">
              <div v-if="person.birthDate" class="font-medium">{{ formatDate(person.birthDate) }}</div>
              <div v-if="person.birthPlace" class="text-sm text-gray-400">{{ person.birthPlace }}</div>
              <div v-if="!person.birthDate && !person.birthPlace" class="text-sm text-gray-500 italic">No especificado</div>
            </div>
          </div>

          <!-- Death -->
          <div v-if="!person.isLiving" class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
            <div class="text-xs text-gray-500 uppercase font-semibold mb-1 flex items-center gap-1">
              <UIcon name="i-heroicons-moon" class="w-4 h-4" />
              Defunción
            </div>
            <div class="text-gray-200">
              <div v-if="person.deathDate" class="font-medium">{{ formatDate(person.deathDate) }}</div>
              <div v-if="person.deathPlace" class="text-sm text-gray-400">{{ person.deathPlace }}</div>
              <div v-if="!person.deathDate && !person.deathPlace" class="text-sm text-gray-500 italic">No especificado</div>
            </div>
          </div>
        </div>

        <!-- Contact Data -->
        <div v-if="person.email || person.phone || person.address || person.pais" class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <div class="text-xs text-gray-500 uppercase font-semibold mb-3 flex items-center gap-1">
            <UIcon name="i-heroicons-envelope" class="w-4 h-4" />
            Datos de Contacto
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div v-if="person.email" class="flex items-center gap-2">
              <UIcon name="i-heroicons-at-symbol" class="w-4 h-4 text-gray-400 shrink-0" />
              <span class="text-gray-300 truncate">{{ person.email }}</span>
            </div>
            <div v-if="person.phone" class="flex items-center gap-2">
              <UIcon name="i-heroicons-phone" class="w-4 h-4 text-gray-400 shrink-0" />
              <span class="text-gray-300 truncate">{{ person.phone }}</span>
            </div>
            <div v-if="person.address" class="flex items-center gap-2">
              <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-gray-400 shrink-0" />
              <span class="text-gray-300 truncate">{{ person.address }}</span>
            </div>
            <div v-if="person.pais" class="flex items-center gap-2">
              <UIcon name="i-heroicons-globe-americas" class="w-4 h-4 text-gray-400 shrink-0" />
              <span class="text-gray-300 truncate">{{ person.pais.nombre }}</span>
            </div>
          </div>
        </div>

        <!-- Biography -->
        <div v-if="person.biography" class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <div class="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
            Biografía / Notas
          </div>
          <p class="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{{ person.biography }}</p>
        </div>

        <!-- Children -->
        <div v-if="children.length > 0" class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <div class="text-xs text-gray-500 uppercase font-semibold mb-3 flex items-center gap-1">
            <UIcon name="i-heroicons-users" class="w-4 h-4" />
            Hijos ({{ children.length }})
          </div>
          <div class="space-y-2">
            <div
              v-for="child in children"
              :key="child.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-gray-900/50 border border-gray-700/30"
            >
              <UAvatar
                :src="child.avatarUrl || ''"
                :alt="child.firstName"
                size="sm"
                :ui="{
                  background: child.gender === 'MALE' ? 'bg-blue-900/50' : child.gender === 'FEMALE' ? 'bg-pink-900/50' : 'bg-gray-800'
                }"
                :class="[
                  'border',
                  child.gender === 'MALE' ? 'border-blue-500/50' : child.gender === 'FEMALE' ? 'border-pink-500/50' : 'border-purple-500/50'
                ]"
              />
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-white truncate">
                  {{ child.firstName }} {{ child.lastName }} {{ child.lastName2 || '' }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ child.gender === 'MALE' ? 'Hijo' : child.gender === 'FEMALE' ? 'Hija' : 'Hijo/a' }}
                  <span v-if="child.birthDate" class="ml-1">· {{ formatDate(child.birthDate) }}</span>
                </div>
              </div>
              <UBadge :color="child.isLiving ? 'emerald' : 'gray'" variant="subtle" size="xs">
                {{ child.isLiving ? 'Vivo/a' : 'Fallecido/a' }}
              </UBadge>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton color="gray" variant="ghost" @click="isOpen = false">
            Cerrar
          </UButton>
          <UButton
            v-if="canEdit"
            color="primary"
            icon="i-heroicons-pencil-square"
            :disabled="person.is_locked"
            @click="emitEdit"
          >
            Editar
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  person: {
    type: Object,
    default: null
  },
  personsList: {
    type: Array,
    default: () => []
  },
  canEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'edit'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const genderColor = computed(() => {
  if (!props.person) return 'gray'
  if (props.person.gender === 'MALE') return 'blue'
  if (props.person.gender === 'FEMALE') return 'pink'
  return 'purple'
})

const genderLabel = computed(() => {
  if (!props.person) return ''
  if (props.person.gender === 'MALE') return 'Masculino'
  if (props.person.gender === 'FEMALE') return 'Femenino'
  return 'Otro'
})

const children = computed(() => {
  if (!props.person || !props.personsList) return []
  return props.personsList.filter(p =>
    p.fatherId === props.person.id || p.motherId === props.person.id
  )
})

function formatDate(dateString) {
  if (!dateString) return ''
  // Try to parse ISO date, otherwise return as is if it's just a string or year
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      timeZone: 'UTC'
    }).format(d)
  } catch (e) {
    return dateString
  }
}

function emitEdit() {
  isOpen.value = false
  emit('edit', props.person)
}
</script>
