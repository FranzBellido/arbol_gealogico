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
              <UIcon name="i-heroicons-star" class="w-4 h-4" />
              Nacimiento
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

        <!-- Biography -->
        <div v-if="person.biography" class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
          <div class="text-xs text-gray-500 uppercase font-semibold mb-2 flex items-center gap-1">
            <UIcon name="i-heroicons-document-text" class="w-4 h-4" />
            Biografía / Notas
          </div>
          <p class="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{{ person.biography }}</p>
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

function formatDate(dateString) {
  if (!dateString) return ''
  // Try to parse ISO date, otherwise return as is if it's just a string or year
  try {
    const d = new Date(dateString)
    if (isNaN(d.getTime())) return dateString
    return new Intl.DateTimeFormat('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
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
