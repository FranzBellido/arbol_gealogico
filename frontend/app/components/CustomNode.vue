<template>
  <div
    class="px-4 py-3 shadow-md rounded-xl border bg-gray-900/90 backdrop-blur-md text-white min-w-[200px] relative transition-all hover:scale-105 hover:shadow-xl"
    :class="genderClass"
  >
    <!-- Avatar & Basic info -->
    <div class="flex items-center gap-3">
      <UAvatar
        :src="data.avatarUrl || ''"
        :alt="data.firstName"
        size="md"
        class="border border-gray-700"
        :ui="{ background: data.gender === 'MALE' ? 'bg-blue-900/50' : data.gender === 'FEMALE' ? 'bg-pink-900/50' : 'bg-gray-800' }"
      />
      <div>
        <div class="font-bold text-sm leading-tight text-white">
          {{ data.firstName }} {{ data.lastName }} {{ data.lastName2 || '' }}
        </div>
        <div v-if="data.maidenName" class="text-xs text-gray-400 italic">
          (née: {{ data.maidenName }})
        </div>
        <div class="text-xs text-gray-400 mt-1">
          {{ lifeSpan }}
        </div>
      </div>
    </div>

    <!-- Handles for connections -->
    <Handle type="target" position="top" class="w-3 h-3 bg-gray-600 border border-gray-900 rounded-full" />
    <Handle type="source" position="bottom" class="w-3 h-3 bg-gray-600 border border-gray-900 rounded-full" />

    <!-- Edit buttons / quick actions -->
    <div v-if="data.canEdit" class="absolute top-2 right-2 z-10">
      <UDropdown :items="dropdownItems" :popper="{ placement: 'bottom-end' }">
        <UButton color="gray" variant="ghost" icon="i-heroicons-ellipsis-vertical" size="xs" @click.stop />
      </UDropdown>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Handle } from '@vue-flow/core'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'view', 'delete'])

const dropdownItems = computed(() => {
  const items = [
    {
      label: 'Editar',
      icon: 'i-heroicons-pencil-square',
      click: () => emit('edit', props.data.id)
    }
  ]
  
  if (props.data.canAdmin && !props.data.isLocked) {
    items.push({
      label: 'Eliminar',
      icon: 'i-heroicons-trash',
      click: () => emit('delete', props.data.id)
    })
  }
  
  return [items]
})

const genderClass = computed(() => {
  if (props.data.gender === 'MALE') return 'border-blue-500/50 ring-1 ring-blue-500/20'
  if (props.data.gender === 'FEMALE') return 'border-pink-500/50 ring-1 ring-pink-500/20'
  return 'border-purple-500/50 ring-1 ring-purple-500/20'
})

const lifeSpan = computed(() => {
  const birth = props.data.birthDate ? new Date(props.data.birthDate).getFullYear() : '?'
  let death = ''
  if (props.data.isLiving) {
    death = 'Presente'
  } else {
    death = props.data.deathDate ? new Date(props.data.deathDate).getFullYear() : '?'
  }
  return `${birth} - ${death}`
})
</script>
