<template>
  <div class="simple-pdf-viewer">
    <!-- Estado de carga -->
    <div
      v-if="loading"
      class="loading-state"
    >
      <div class="spinner">
        📄
      </div>
      <p>Cargando PDF con @tato30/vue-pdf...</p>
      <small>{{ src?.substring(0, 60) }}...</small>
    </div>
    
    <!-- Estado de error -->
    <div
      v-else-if="error"
      class="error-state"
    >
      <div class="error-icon">
        ❌
      </div>
      <p>Error al cargar PDF</p>
      <small>{{ error }}</small>
      <button
        class="retry-btn"
        @click="retry"
      >
        Reintentar
      </button>
    </div>
    
    <!-- Contenido PDF -->
    <div
      v-else
      class="pdf-content"
    >
      <!-- Barra de herramientas -->
      <div class="toolbar">
        <button
          :disabled="page <= 1"
          class="nav-btn"
          @click="prevPage"
        >
          ⬅️ Anterior
        </button>
        <span class="page-info">Página {{ page }} de {{ totalPages }}</span>
        <button
          :disabled="page >= totalPages"
          class="nav-btn"
          @click="nextPage"
        >
          Siguiente ➡️
        </button>
        
        <div class="zoom-controls">
          <button
            class="zoom-btn"
            @click="zoomOut"
          >
            🔍-
          </button>
          <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
          <button
            class="zoom-btn"
            @click="zoomIn"
          >
            🔍+
          </button>
        </div>
      </div>
      
      <!-- Visor PDF -->
      <div class="pdf-display">
        <VuePDF
          :src="src"
          :page="page"
          :scale="scale"
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

// Props
const props = defineProps({
  src: {
    type: [String, Object, Uint8Array],
    required: true,
  },
})

// Emits
const emit = defineEmits(['loaded', 'error'])

// Estado reactivo
const loading = ref(true)
const error = ref(null)
const page = ref(1)
const totalPages = ref(0)
const scale = ref(1.0)

// Funciones de navegación
const prevPage = () => {
  if (page.value > 1) {
    page.value--
  }
}

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++
  }
}

// Funciones de zoom
const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 3.0)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

// Handlers de eventos
const onLoaded = pdf => {
  console.log('✅ PDF cargado en SimplePdfViewer:', pdf)
  loading.value = false
  error.value = null
  totalPages.value = pdf.numPages || 1
  emit('loaded', pdf)
}

const onError = errorInfo => {
  console.error('❌ Error en SimplePdfViewer:', errorInfo)
  loading.value = false
  error.value = errorInfo.message || 'Error desconocido al cargar PDF'
  emit('error', errorInfo)
}

// Función para reintentar
const retry = () => {
  loading.value = true
  error.value = null
  page.value = 1
}

// Watcher para cambios en src
watch(() => props.src, () => {
  if (props.src) {
    retry()
  }
}, { immediate: true })
</script>

<style scoped>
.simple-pdf-viewer {
  display: flex;
  overflow: hidden;
  flex-direction: column;
  border-radius: 8px;
  background: #f5f5f5;
  block-size: 100%;
  inline-size: 100%;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  block-size: 100%;
  min-block-size: 300px;
  text-align: center;
}

.spinner {
  animation: pulse 2s infinite;
  font-size: 48px;
  margin-block-end: 16px;
}

@keyframes pulse {
  0%,
  100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.error-icon {
  font-size: 48px;
  margin-block-end: 16px;
}

.retry-btn {
  border: none;
  border-radius: 4px;
  background: #1976d2;
  color: white;
  cursor: pointer;
  margin-block-start: 16px;
  padding-block: 8px;
  padding-inline: 16px;
}

.retry-btn:hover {
  background: #1565c0;
}

.pdf-content {
  display: flex;
  flex-direction: column;
  block-size: 100%;
}

.toolbar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-block-end: 1px solid #e0e0e0;
  padding-block: 12px;
  padding-inline: 16px;
}

.nav-btn,
.zoom-btn {
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  padding-block: 6px;
  padding-inline: 12px;
}

.nav-btn:hover,
.zoom-btn:hover {
  background: #f0f0f0;
}

.nav-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.page-info,
.zoom-info {
  color: #333;
  font-weight: 500;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pdf-display {
  display: flex;
  overflow: auto;
  flex: 1;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
  background: #f5f5f5;
}

/* Responsive */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    padding: 8px;
    gap: 8px;
  }

  .zoom-controls {
    order: -1;
  }
}
</style>
