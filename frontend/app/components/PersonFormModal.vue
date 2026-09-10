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
              v-if="canAdmin"
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

      <UTabs :items="tabItems" class="w-full">
        <template #item="{ item }">
          <!-- TAB: Datos Personales -->
          <div v-if="item.key === 'person'" class="pt-4">
            <form @submit.prevent="save" class="space-y-4">
              <fieldset :disabled="isLocked" class="contents">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormGroup label="Fecha de Nacimiento">
                    <UInput type="date" v-model="form.birthDate" />
                  </UFormGroup>
                  <UFormGroup label="Lugar de Nacimiento">
                    <UInput v-model="form.birthPlace" placeholder="Ciudad, País" />
                  </UFormGroup>
                </div>

                <div v-if="!form.isLiving" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UFormGroup label="Fecha de Defunción">
                    <UInput type="date" v-model="form.deathDate" />
                  </UFormGroup>
                  <UFormGroup label="Lugar de Defunción">
                    <UInput v-model="form.deathPlace" placeholder="Ciudad, País" />
                  </UFormGroup>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <UFormGroup label="Correo Electrónico">
                      <UInput v-model="form.email" type="email" placeholder="correo@ejemplo.com" />
                    </UFormGroup>
                    <UFormGroup label="Teléfono">
                      <UInput v-model="form.phone" placeholder="+59170000000" />
                    </UFormGroup>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                    <UFormGroup label="Dirección">
                      <UInput v-model="form.address" placeholder="Av. Principal #123" />
                    </UFormGroup>
                    <UFormGroup label="País de Residencia">
                      <USelect
                        v-model="form.pais_id"
                        :options="countryOptions"
                      />
                    </UFormGroup>
                  </div>
                </div>

                <UFormGroup label="Biografía">
                  <UTextarea v-model="form.biography" placeholder="Escribe algo sobre la historia de esta persona..." />
                </UFormGroup>
              </fieldset>

              <div class="flex justify-end gap-3 pt-4 border-t border-gray-800">
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
          </div>

          <!-- TAB: Parejas / Uniones -->
          <div v-else-if="item.key === 'unions'" class="pt-4 space-y-4">
            <div class="flex justify-end">
              <UButton
                v-if="!isLocked"
                color="pink"
                variant="soft"
                icon="i-heroicons-plus"
                @click="emitCreateUnion"
              >
                Agregar Pareja
              </UButton>
            </div>
            
            <div v-if="personUnions.length === 0" class="text-center py-6 text-gray-400">
              No hay uniones registradas.
            </div>

            <div class="space-y-2">
              <div
                v-for="union in personUnions"
                :key="union.id"
                class="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700/30"
              >
                <UAvatar
                  :src="union.partner.avatarUrl || ''"
                  :alt="union.partner.firstName"
                  size="md"
                  :ui="{ background: union.partner.gender === 'MALE' ? 'bg-blue-900/50' : union.partner.gender === 'FEMALE' ? 'bg-pink-900/50' : 'bg-gray-800' }"
                  class="border"
                  :class="union.partner.gender === 'MALE' ? 'border-blue-500/50' : union.partner.gender === 'FEMALE' ? 'border-pink-500/50' : 'border-purple-500/50'"
                />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-white truncate">
                    {{ union.partner.firstName }} {{ union.partner.lastName }} {{ union.partner.lastName2 || '' }}
                  </div>
                  <div class="text-xs text-gray-400">
                    <span v-if="union.marriageDate">Casados: {{ formatDate(union.marriageDate) }}</span>
                    <span v-if="union.divorceDate" class="ml-1">· Divorciados: {{ formatDate(union.divorceDate) }}</span>
                    <span v-if="!union.marriageDate && !union.divorceDate">Pareja</span>
                  </div>
                </div>
                <UBadge :color="union.isCurrent ? 'pink' : 'gray'" variant="subtle" size="xs">
                  {{ union.isCurrent ? 'Actual' : 'Anterior' }}
                </UBadge>
                <div v-if="!isLocked" class="flex items-center gap-1 ml-2">
                  <UButton icon="i-heroicons-pencil-square" size="sm" variant="ghost" color="gray" @click="emitEditUnion(union)" />
                </div>
              </div>
            </div>
            
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <UButton type="button" color="gray" variant="ghost" @click="isOpen = false">
                Cerrar
              </UButton>
            </div>
          </div>
        </template>
      </UTabs>
    </UCard>
  </UModal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()


const props = defineProps({
  modelValue: Boolean,
  person: Object,
  personsList: Array,
  unionsList: {
    type: Array,
    default: () => []
  },
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

const emit = defineEmits(['update:modelValue', 'save', 'delete', 'toggle-lock', 'edit-union', 'create-union'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEdit = computed(() => !!props.person?.id)

const tabItems = computed(() => {
  const items = [{ key: 'person', label: 'Datos Personales' }]
  if (isEdit.value) {
    items.push({ key: 'unions', label: 'Parejas / Uniones' })
  }
  return items
})

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
  biography: '',
  pais_id: ''
})

const form = ref(defaultForm())

const maleOptions = computed(() =>
  (props.personsList || [])
    .filter(p => p.gender === 'MALE' && p.id !== props.person?.id)
    .map(p => ({ label: `${p.firstName} ${p.lastName} ${p.lastName2 || ''}`.trim(), value: p.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const femaleOptions = computed(() =>
  (props.personsList || [])
    .filter(p => p.gender === 'FEMALE' && p.id !== props.person?.id)
    .map(p => ({ label: `${p.firstName} ${p.lastName} ${p.lastName2 || ''}`.trim(), value: p.id }))
    .sort((a, b) => a.label.localeCompare(b.label))
)

const countries = ref([])
const countryOptions = computed(() => {
  return [
    { label: 'Ninguno', value: '' },
    ...countries.value.map(c => ({ label: c.nombre, value: c.pais_id }))
  ]
})

async function fetchCountries() {
  try {
    const data = await auth.apiFetch('/countries')
    countries.value = data
  } catch (error) {
    console.error('Error fetching countries:', error)
  }
}

onMounted(() => {
  fetchCountries()
})

function initForm() {
  const newPerson = props.person
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
      biography: newPerson.biography || '',
      pais_id: newPerson.pais_id || ''
    }
  } else {
    form.value = defaultForm()
  }
}

watch(
  () => props.person,
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

function save() {
  const payload = { ...form.value, id: props.person?.id }
  if (payload.pais_id === '' || payload.pais_id == null) {
    payload.pais_id = null
  } else {
    payload.pais_id = Number(payload.pais_id)
  }
  emit('save', payload)
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

const personUnions = computed(() => {
  if (!props.person || !props.unionsList || !props.personsList) return [];
  return props.unionsList
    .filter(u => u.partner1Id === props.person.id || u.partner2Id === props.person.id)
    .map(u => {
      const partnerId = u.partner1Id === props.person.id ? u.partner2Id : u.partner1Id;
      const partner = props.personsList.find(p => p.id === partnerId);
      return { ...u, partner };
    })
    .filter(u => u.partner);
});

function formatDate(dateString) {
  if (!dateString) return ''
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

function emitEditUnion(union) {
  emit('edit-union', union)
}

function emitCreateUnion() {
  emit('create-union', props.person.id)
}
</script>
