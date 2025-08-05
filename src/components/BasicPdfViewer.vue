<template>
  <div class="basic-pdf-viewer">
    <div
      v-if="error"
      class="error-state"
    >
      <p>Error: {{ error }}</p>
      <button @click="retry">
        Reintentar
      </button>
    </div>
    
    <div
      v-else-if="loading"
      class="loading-state"
    >
      <p>Cargando PDF...</p>
    </div>
    
    <div
      v-else
      class="viewer-container"
    >
      <!-- Controles básicos -->
      <div class="controls">
        <button
          :disabled="page <= 1"
          @click="previousPage"
        >
          Anterior
        </button>
        <span>{{ page }} / {{ totalPages }}</span>
        <button
          :disabled="page >= totalPages"
          @click="nextPage"
        >
          Siguiente
        </button>
        
        <button @click="zoomOut">
          -
        </button>
        <span>{{ Math.round(scale * 100) }}%</span>
        <button @click="zoomIn">
          +
        </button>
      </div>
      
      <!-- PDF -->
      <div class="pdf-content">
        <VuePDF
          :src="src"
          :page="page"
          :scale="scale"
          @loaded="handleLoaded"
          @loading-failed="handleError"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { VuePDF } from '@tato30/vue-pdf'
import { ref, watch } from 'vue'

// Props
const props = defineProps({
  src: {
    type: [String, Object, Uint8Array],
    required: true,
  },
})

// Reactive state
const loading = ref(true)
const error = ref(null)
const page = ref(1)
const totalPages = ref(0)
const scale = ref(1.0)

// Methods
const handleLoaded = pdf => {
  console.log('PDF cargado:', pdf)
  loading.value = false
  totalPages.value = pdf.numPages
  error.value = null
}

const handleError = err => {
  console.error('Error cargando PDF:', err)
  loading.value = false
  error.value = err.message || 'Error al cargar PDF'
}

const retry = () => {
  loading.value = true
  error.value = null
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
  }
}

const previousPage = () => {
  if (page.value > 1) {
    page.value--
  }
}

const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.2, 2.0)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.2, 0.5)
}

// Watch src changes
watch(() => props.src, () => {
  loading.value = true
  error.value = null
  page.value = 1
  totalPages.value = 0
}, { immediate: true })
</script>

<style scoped>
.basic-pdf-viewer {
  block-size: 100%;
  inline-size: 100%;
}

.loading-state,
 .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  block-size: 300px;
}

.controls {
  display: flex;
  align-items: center;
  padding: 10px;
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

.pdf-content {
  overflow: auto;
  padding: 20px;
}
</style>
