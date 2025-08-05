<template>
  <div class="ultra-simple-pdf-viewer">
    <div v-if="loading">
      Cargando PDF...
    </div>
    
    <div v-else-if="error">
      Error: {{ error }}
      <br>
      <button @click="reload">
        Reintentar
      </button>
    </div>
    
    <div v-else>
      <div class="controls">
        <button 
          :disabled="currentPage <= 1"
          @click="currentPage--"
        >
          ◀
        </button>
        
        <span>{{ currentPage }} / {{ totalPages }}</span>
        
        <button 
          :disabled="currentPage >= totalPages"
          @click="currentPage++"
        >
          ▶
        </button>
        
        <button @click="zoomOut">
          -
        </button>
        
        <span>{{ Math.round(zoom * 100) }}%</span>
        
        <button @click="zoomIn">
          +
        </button>
      </div>
      
      <div class="pdf-container">
        <VuePDF
          :src="src"
          :page="currentPage"
          :scale="zoom"
          @loaded="onLoaded"
          @loading-failed="onError"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { VuePDF } from '@tato30/vue-pdf'
import { ref, watch } from 'vue'

const props = defineProps({
  src: {
    type: [String, Object, Uint8Array],
    required: true,
  },
})

const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const zoom = ref(1.0)

const onLoaded = pdf => {
  console.log('PDF cargado exitosamente:', pdf)
  loading.value = false
  totalPages.value = pdf.numPages
  error.value = null
}

const onError = err => {
  console.error('Error al cargar PDF:', err)
  loading.value = false
  error.value = err.message || 'Error desconocido'
}

const reload = () => {
  loading.value = true
  error.value = null
  currentPage.value = 1
  totalPages.value = 0
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.2, 2.5)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.2, 0.5)
}

watch(() => props.src, () => {
  reload()
}, { immediate: true })
</script>

<style scoped>
.ultra-simple-pdf-viewer {
  block-size: 100%;
  inline-size: 100%;
}

.controls {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f0f0f0;
  border-block-end: 1px solid #ccc;
  gap: 10px;
}

.controls button {
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  padding-block: 5px;
  padding-inline: 10px;
}

.controls button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pdf-container {
  overflow: auto;
  padding: 20px;
  max-block-size: 70vh;
  text-align: center;
}
</style>
