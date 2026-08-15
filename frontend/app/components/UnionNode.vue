<template>
  <div class="w-8 h-8 rounded-full bg-pink-500/20 border-2 border-pink-500 flex items-center justify-center shadow-lg relative group hover:scale-110 transition-transform">
    <UIcon name="i-heroicons-heart" class="text-pink-500 w-4 h-4 animate-pulse" />
    
    <!-- Tooltip / Marriage date info -->
    <div class="absolute bottom-full mb-2 hidden group-hover:block bg-gray-900 text-xs px-2 py-1 rounded border border-gray-800 whitespace-nowrap text-white z-50">
      Unión {{ marriageYear }}
    </div>

    <!-- Handles to connect partners and children -->
    <Handle type="target" position="left" id="p1" class="bg-pink-500 w-2 h-2" />
    <Handle type="target" position="right" id="p2" class="bg-pink-500 w-2 h-2" />
    <Handle type="source" position="bottom" id="children" class="bg-pink-500 w-2 h-2" />
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

const marriageYear = computed(() => {
  if (!props.data.marriageDate) return ''
  return new Date(props.data.marriageDate).getFullYear()
})
</script>
