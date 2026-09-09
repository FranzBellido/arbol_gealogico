<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-white">
            {{ isEdit ? 'Editar Unión / Matrimonio' : 'Crear Nueva Unión / Matrimonio' }}
          </h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <form @submit.prevent="save" class="space-y-4">
        <UFormGroup label="Primer Miembro" required>
          <USelect
            v-model="form.partner1Id"
            :options="personOptions"
            placeholder="Seleccionar persona"
            required
          />
        </UFormGroup>

        <UFormGroup label="Segundo Miembro" required>
          <USelect
            v-model="form.partner2Id"
            :options="personOptions"
            placeholder="Seleccionar persona"
            required
          />
        </UFormGroup>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormGroup label="Fecha de Unión">
            <UInput type="date" v-model="form.marriageDate" />
          </UFormGroup>
          <UFormGroup label="Fecha de Divorcio (si aplica)">
            <UInput type="date" v-model="form.divorceDate" />
          </UFormGroup>
        </div>

        <UFormGroup>
          <UCheckbox v-model="form.isCurrent" label="Unión actualmente activa" />
        </UFormGroup>

        <div class="flex justify-end gap-3 pt-4">
          <UButton v-if="isEdit" type="button" color="red" variant="ghost" @click="handleDelete">
            Eliminar
          </UButton>
          <UButton type="button" color="gray" variant="ghost" @click="isOpen = false">
            Cancelar
          </UButton>
          <UButton type="submit" color="primary">
            {{ isEdit ? 'Guardar Cambios' : 'Registrar Unión' }}
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  personsList: Array,
  union: Object
})

const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.union?.id)

function defaultForm() {
  return {
    partner1Id: '',
    partner2Id: '',
    marriageDate: '',
    divorceDate: '',
    isCurrent: true
  }
}

const form = ref(defaultForm())

function initForm() {
  if (props.union) {
    form.value = {
      partner1Id: props.union.partner1Id || '',
      partner2Id: props.union.partner2Id || '',
      marriageDate: props.union.marriageDate ? props.union.marriageDate.substring(0, 10) : '',
      divorceDate: props.union.divorceDate ? props.union.divorceDate.substring(0, 10) : '',
      isCurrent: props.union.isCurrent !== false
    }
  } else {
    form.value = defaultForm()
  }
}

watch(
  () => props.union,
  initForm,
  { immediate: true }
)

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      initForm()
    }
  }
)

const personOptions = computed(() => {
  return props.personsList.map((p) => ({
    label: `${p.firstName} ${p.lastName} (${p.gender === 'MALE' ? 'M' : 'F'})`,
    value: p.id
  }))
})

function save() {
  if (form.value.partner1Id === form.value.partner2Id) {
    alert('Una persona no puede formar una unión consigo misma.')
    return
  }
  emit('save', { id: props.union?.id, ...form.value })
  isOpen.value = false
}

function handleDelete() {
  if (confirm('¿Estás seguro de que deseas eliminar esta unión?')) {
    emit('delete', props.union.id)
    isOpen.value = false
  }
}
</script>
