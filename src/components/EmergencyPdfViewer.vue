<template>
  <div class="emergency-pdf-viewer">
    <div class="debug-info">
      <h4>🔧 Visor PDF de Emergencia - Debug</h4>
      <p><strong>Estado:</strong> {{ currentState }}</p>
      <p><strong>URL recibida:</strong> {{ src ? 'SÍ' : 'NO' }}</p>
      <p><strong>Tipo de URL:</strong> {{ getUrlType() }}</p>
      <p><strong>PDF cargado:</strong> {{ isLoaded ? 'SÍ' : 'NO' }}</p>
      <p><strong>Páginas totales:</strong> {{ totalPages }}</p>
      <p><strong>Página actual:</strong> {{ currentPage }}</p>
    </div>
    
    <div class="controls">
      <button
        :disabled="currentPage <= 1"
        @click="previousPage"
      >
        ⬅ Anterior
      </button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button
        :disabled="currentPage >= totalPages"
        @click="nextPage"
      >
        Siguiente ➡
      </button>
      
      <button @click="zoomOut">
        🔍-
      </button>
      <span>{{ Math.round(zoom * 100) }}%</span>
      <button @click="zoomIn">
        🔍+
      </button>
      
      <button @click="forceReload">
        🔄 Recargar
      </button>
    </div>
    
    <div class="pdf-container">
      <div
        v-if="isLoading"
        class="status-message"
      >
        ⏳ Cargando PDF... ({{ loadingTime }}s)
      </div>
      
      <div
        v-else-if="error"
        class="status-message error"
      >
        ❌ Error: {{ error }}
        <br>
        <button @click="forceReload">
          🔄 Intentar de nuevo
        </button>
      </div>
      
      <div
        v-else-if="!src"
        class="status-message"
      >
        📄 Esperando URL del PDF...
      </div>
      
      <div
        v-else
        class="pdf-display"
      >
        <VuePDF
          :src="src"
          :page="currentPage"
          :scale="zoom"
          @loaded="onLoaded"
          @loading-failed="onError"
          @progress="onProgress"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { VuePDF } from '@tato30/vue-pdf'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  src: {
    type: [String, Object, Uint8Array],
    default: null,
  },
})

// Estados
const isLoading = ref(false)
const isLoaded = ref(false)
const error = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const zoom = ref(1.0)
const loadingTime = ref(0)
const currentState = ref('Inicializando')

// Timer para loading
let loadingTimer = null

const getUrlType = () => {
  if (!props.src) return 'Sin URL'
  if (typeof props.src === 'string') {
    if (props.src.startsWith('blob:')) return 'Blob URL'
    if (props.src.startsWith('http')) return 'HTTP URL'
    
    return 'String URL'
  }
  
  return typeof props.src
}

const startLoadingTimer = () => {
  loadingTime.value = 0
  loadingTimer = setInterval(() => {
    loadingTime.value++
    if (loadingTime.value > 30) {
      clearInterval(loadingTimer)
      onError(new Error('Timeout: PDF no se cargó en 30 segundos'))
    }
  }, 1000)
}

const stopLoadingTimer = () => {
  if (loadingTimer) {
    clearInterval(loadingTimer)
    loadingTimer = null
  }
}

const onLoaded = pdf => {
  console.log('🎉 EmergencyPdfViewer: PDF cargado exitosamente!', pdf)
  
  stopLoadingTimer()
  isLoading.value = false
  isLoaded.value = true
  error.value = null
  totalPages.value = pdf.numPages
  currentState.value = 'PDF Cargado'
  
  // Reset a página 1
  currentPage.value = 1
}

const onError = err => {
  console.error('💥 EmergencyPdfViewer: Error al cargar PDF:', err)
  
  stopLoadingTimer()
  isLoading.value = false
  isLoaded.value = false
  error.value = err.message || err.toString()
  currentState.value = 'Error'
}

const onProgress = progress => {
  console.log('📊 EmergencyPdfViewer: Progreso de carga:', progress)
  currentState.value = `Cargando... ${Math.round((progress.loaded / progress.total) * 100)}%`
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const zoomIn = () => {
  zoom.value = Math.min(zoom.value + 0.25, 3.0)
}

const zoomOut = () => {
  zoom.value = Math.max(zoom.value - 0.25, 0.5)
}

const forceReload = () => {
  console.log('🔄 EmergencyPdfViewer: Forzando recarga...')
  
  // Reset completo
  stopLoadingTimer()
  isLoading.value = true
  isLoaded.value = false
  error.value = null
  currentPage.value = 1
  totalPages.value = 0
  currentState.value = 'Recargando'
  
  // Iniciar timer
  startLoadingTimer()
}

// Watcher para cambios de src
watch(() => props.src, newSrc => {
  console.log('🔄 EmergencyPdfViewer: Nueva URL recibida:', newSrc)
  
  if (newSrc) {
    isLoading.value = true
    isLoaded.value = false
    error.value = null
    currentPage.value = 1
    totalPages.value = 0
    currentState.value = 'Iniciando carga'
    
    startLoadingTimer()
  } else {
    stopLoadingTimer()
    isLoading.value = false
    isLoaded.value = false
    currentState.value = 'Sin PDF'
  }
}, { immediate: true })

onMounted(() => {
  console.log('🚀 EmergencyPdfViewer montado con:', props.src)
})
</script>

<style scoped>
.emergency-pdf-viewer {
  padding: 10px;
  border: 2px solid #ff9800;
  border-radius: 5px;
  block-size: 100%;
  inline-size: 100%;
}

.debug-info {
  padding: 10px;
  border: 1px solid #ff9800;
  border-radius: 3px;
  background: #fff3e0;
  margin-block-end: 10px;
}

.debug-info h4 {
  color: #e65100;
  margin-block-start: 0;
}

.debug-info p {
  font-size: 12px;
  margin-block: 2px;
}

.controls {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 3px;
  background: #f5f5f5;
  gap: 10px;
  margin-block-end: 10px;
}

.controls button {
  border: 1px solid #ccc;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  padding-block: 5px;
  padding-inline: 10px;
}

.controls button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.controls button:hover:not(:disabled) {
  background: #e3f2fd;
}

.pdf-container {
  border: 1px solid #ddd;
  border-radius: 3px;
  background: #fafafa;
  min-block-size: 400px;
}

.pdf-display {
  padding: 20px;
  text-align: center;
}

.status-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  block-size: 300px;
  color: #666;
  font-size: 16px;
}

.status-message.error {
  color: #d32f2f;
}

.status-message button {
  border: 1px solid #ccc;
  border-radius: 3px;
  background: white;
  cursor: pointer;
  margin-block-start: 10px;
  padding-block: 8px;
  padding-inline: 16px;
}
</style>
