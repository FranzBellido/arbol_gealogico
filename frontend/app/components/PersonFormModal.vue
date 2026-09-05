<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="text-base font-semibold leading-6 text-white">
              {{ isEdit ? 'Editar Familiar' : 'Agregar Familiar' }}
            </h3>
            <!-- Badge de bloqueado -->
            <UBadge v-if="isLocked" color="amber" variant="soft" size="xs" class="gap-1">
              <UIcon name="i-heroicons-lock-closed" class="w-3 h-3" />
              Bloqueado
            </UBadge>
          </div>
          <div class="flex items-center gap-2">
            <!-- Botón de bloqueo/desbloqueo — solo admin del árbol en modo edición -->
            <UButton
              v-if="isEdit && canAdmin"
              :color="isLocked ? 'amber' : 'gray'"
              :variant="isLocked ? 'soft' : 'ghost'"
              :icon="isLocked ? 'i-heroicons-lock-open' : 'i-heroicons-lock-closed'"
              size="xs"
              @click="handleToggleLock"
            >
              {{ isLocked ? 'Desbloquear' : 'Bloquear' }}
            </UButton>
            <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark" class="-my-1" @click="isOpen = false" />
          </div>
        </div>
      </template>

      <!-- Aviso cuando está bloqueado -->
      <UAlert
        v-if="isLocked"
        color="amber"
        variant="soft"
        icon="i-heroicons-lock-closed"
        title="Registro bloqueado"
        description="Este registro es de solo lectura. Solo el administrador del árbol puede desbloquearlo."
        class="mb-4"
      />

      <form @submit.prevent="save" class="space-y-4">
        <fieldset :disabled="isLocked" class="contents">
          <div class="grid grid-cols-3 gap-4">
            <UFormGroup label="Nombre" required>
              <UInput v-model="form.firstName" placeholder="Juan" required />
            </UFormGroup>
            <UFormGroup label="Primer Apellido" required>
              <UInput v-model="form.lastName" placeholder="Pérez" required />
            </UFormGroup>
            <UFormGroup label="Segundo Apellido">
              <UInput v-model="form.lastName2" placeholder="Gómez" />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Género" required>
              <USelect
                v-model="form.gender"
                :options="[
                  { label: 'Masculino', value: 'MALE' },
                  { label: 'Femenino', value: 'FEMALE' },
                  { label: 'Otro', value: 'OTHER' }
                ]"
              />
            </UFormGroup>
            <UFormGroup label="Apellido de Soltera (opcional)">
              <UInput v-model="form.maidenName" placeholder="Si aplica" />
            </UFormGroup>
          </div>

          <UFormGroup label="Estado Vital">
            <div class="flex items-center gap-4 mt-2">
              <URadio v-model="form.isLiving" :value="true" label="Vivo" />
              <URadio v-model="form.isLiving" :value="false" label="Fallecido" />
            </div>
          </UFormGroup>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Fecha de Nacimiento">
              <UInput type="date" v-model="form.birthDate" />
            </UFormGroup>
            <UFormGroup label="Lugar de Nacimiento">
              <UInput v-model="form.birthPlace" placeholder="Ciudad, País" />
            </UFormGroup>
          </div>

          <div v-if="!form.isLiving" class="grid grid-cols-2 gap-4">
            <UFormGroup label="Fecha de Defunción">
              <UInput type="date" v-model="form.deathDate" />
            </UFormGroup>
            <UFormGroup label="Lugar de Defunción">
              <UInput v-model="form.deathPlace" placeholder="Ciudad, País" />
            </UFormGroup>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormGroup label="Padre">
              <USelect
                v-model="form.fatherId"
                :options="[{ label: 'Ninguno', value: '' }, ...maleOptions]"
              />
            </UFormGroup>
            <UFormGroup label="Madre">
              <USelect
                v-model="form.motherId"
                :options="[{ label: 'Ninguno', value: '' }, ...femaleOptions]"
              />
            </UFormGroup>
          </div>

          <UFormGroup label="Foto de la Persona">
            <div class="flex items-center gap-4 mt-2">
              <UAvatar
                :src="form.avatarUrl"
                :alt="form.firstName"
                size="lg"
                class="border border-gray-700 bg-gray-800"
              />

            </div>
            <UInput v-model="form.avatarUrl" placeholder="O ingresa la URL directamente..." class="mt-2" :disabled="isLocked" />
          </UFormGroup>

          <!-- Datos de Contacto -->
          <div class="border-t border-gray-800 pt-4 mt-2">
            <h4 class="text-sm font-medium text-gray-400 mb-3">Datos de Contacto</h4>
            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Correo Electrónico">
                <UInput v-model="form.email" type="email" placeholder="correo@ejemplo.com" />
              </UFormGroup>
              <UFormGroup label="Teléfono">
                <UInput v-model="form.phone" placeholder="+59170000000" />
              </UFormGroup>
            </div>
            <UFormGroup label="Dirección" class="mt-3">
              <UInput v-model="form.address" placeholder="Av. Principal #123" />
            </UFormGroup>
          </div>

          <UFormGroup label="Biografía">
            <UTextarea v-model="form.biography" placeholder="Escribe algo sobre la historia de esta persona..." />
          </UFormGroup>
        </fieldset>

        <div class="flex justify-end gap-3 pt-4">
          <UButton v-if="isEdit && !isLocked" color="red" variant="ghost" @click="handleDelete">
            Eliminar
          </UButton>
          <UButton type="button" color="gray" variant="ghost" @click="isOpen = false">
            {{ isLocked ? 'Cerrar' : 'Cancelar' }}
          </UButton>
          <UButton v-if="!isLocked" type="submit" color="primary">
            Guardar
          </UButton>
        </div>
      </form>
    </UCard>
  </UModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()


const props = defineProps({
  modelValue: Boolean,
  person: Object,
  personsList: Array,
  /** Si el registro está bloqueado (solo lectura) */
  isLocked: {
    type: Boolean,
    default: false
  },
  /** Si el usuario actual es admin del árbol (puede bloquear/desbloquear) */
  canAdmin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'delete', 'toggle-lock'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.person?.id)

const defaultForm = () => ({
  firstName: '',
  lastName: '',
  lastName2: '',
  email: '',
  phone: '',
  address: '',
  maidenName: '',
  gender: 'MALE',
  isLiving: true,
  birthDate: '',
  birthPlace: '',
  deathDate: '',
  deathPlace: '',
  fatherId: '',
  motherId: '',
  avatarUrl: '',
  biography: ''
})

const form = ref(defaultForm())

const maleOptions = computed(() =>
  (props.personsList || [])
    .filter(p => p.gender === 'MALE' && p.id !== props.person?.id)
    .map(p => ({ label: `${p.firstName} ${p.lastName}`, value: p.id }))
)

const femaleOptions = computed(() =>
  (props.personsList || [])
    .filter(p => p.gender === 'FEMALE' && p.id !== props.person?.id)
    .map(p => ({ label: `${p.firstName} ${p.lastName}`, value: p.id }))
)

watch(
  () => props.person,
  (newPerson) => {
    if (newPerson) {
      form.value = {
        firstName: newPerson.firstName || '',
        lastName: newPerson.lastName || '',
        lastName2: newPerson.lastName2 || '',
        email: newPerson.email || '',
        phone: newPerson.phone || '',
        address: newPerson.address || '',
        maidenName: newPerson.maidenName || '',
        gender: newPerson.gender || 'MALE',
        isLiving: newPerson.isLiving !== false,
        birthDate: newPerson.birthDate ? newPerson.birthDate.substring(0, 10) : '',
        birthPlace: newPerson.birthPlace || '',
        deathDate: newPerson.deathDate ? newPerson.deathDate.substring(0, 10) : '',
        deathPlace: newPerson.deathPlace || '',
        fatherId: newPerson.fatherId || '',
        motherId: newPerson.motherId || '',
        avatarUrl: newPerson.avatarUrl || '',
        biography: newPerson.biography || ''
      }
    } else {
      form.value = defaultForm()
    }
  },
  { immediate: true }
)

function save() {
  emit('save', { id: props.person?.id, ...form.value })
  isOpen.value = false
}

function handleDelete() {
  if (confirm('¿Estás seguro de que quieres eliminar a esta persona? Esto podría alterar las uniones o conexiones.')) {
    emit('delete', props.person.id)
    isOpen.value = false
  }
}

function handleToggleLock() {
  emit('toggle-lock', props.person.id, !props.isLocked)
  isOpen.value = false
}
</script>
