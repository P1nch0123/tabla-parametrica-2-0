<template>
  <div class="working-pdf-viewer">
    <!-- Debug info -->
    <div
      v-if="debugMode"
      class="debug-info pa-2 mb-2"
      style=" border: 1px solid #ccc;background-color: #f0f0f0; font-size: 12px;"
    >
      <div><strong>Debug Info:</strong></div>
      <div>PDF Source Type: {{ getSrcType() }}</div>
      <div>Loading: {{ loading }}</div>
      <div>Error: {{ error }}</div>
      <div>Total Pages: {{ numPages }}</div>
      <div>Current Page: {{ page }}</div>
      <div>Scale: {{ scale }}</div>
    </div>

    <div
      v-if="loading"
      class="d-flex justify-center align-center pa-4"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="64"
      />
      <span class="ms-4">Cargando PDF...</span>
    </div>
    
    <div
      v-else-if="error"
      class="pa-4"
    >
      <VAlert
        type="error"
        :text="`Error al cargar PDF: ${error}`"
      />
      <div class="mt-2">
        <VBtn
          color="primary"
          size="small"
          @click="retryLoad"
        >
          Reintentar
        </VBtn>
      </div>
    </div>
    
    <div
      v-else-if="src"
      class="pdf-container"
    >
      <!-- Controles simples -->
      <div class="d-flex align-center justify-center mb-4 gap-2">
        <VBtn
          icon="mdi-chevron-left"
          variant="outlined"
          size="small"
          :disabled="page <= 1"
          @click="previousPage"
        />
        
        <VChip>
          {{ page }} / {{ numPages || '?' }}
        </VChip>
        
        <VBtn
          icon="mdi-chevron-right"
          variant="outlined"
          size="small"
          :disabled="page >= numPages"
          @click="nextPage"
        />
        
        <VSpacer />
        
        <VBtn
          icon="mdi-magnify-minus"
          variant="outlined"
          size="small"
          @click="zoomOut"
        />
        
        <VChip>{{ Math.round(scale * 100) }}%</VChip>
        
        <VBtn
          icon="mdi-magnify-plus"
          variant="outlined"
          size="small"
          @click="zoomIn"
        />
      </div>
      
      <!-- Visor PDF -->
      <div class="pdf-display">
        <div class="pdf-wrapper">
          <VuePDF
            :src="src"
            :page="page"
            :scale="scale"
            @loaded="onLoaded"
            @loading-failed="onError"
            @progress="onProgress"
          />
        </div>
      </div>
    </div>
    
    <div
      v-else
      class="d-flex justify-center align-center pa-8"
    >
      <VIcon
        icon="mdi-file-pdf-box"
        size="64"
        color="grey"
      />
      <span class="ms-4 text-h6">No hay PDF para mostrar</span>
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
  debugMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['loaded', 'error'])

// Estado reactivo
const page = ref(1)
const numPages = ref(0)
const scale = ref(1.0)
const loading = ref(false)
const error = ref(null)

// Métodos utilitarios
const getSrcType = () => {
  if (!props.src) return 'null'
  if (typeof props.src === 'string') {
    if (props.src.startsWith('blob:')) return 'blob URL'
    if (props.src.startsWith('http')) return 'HTTP URL'
    
    return 'string'
  }
  if (props.src instanceof Uint8Array) return 'Uint8Array'
  if (typeof props.src === 'object') return 'object'
  
  return typeof props.src
}

// Métodos de navegación
const previousPage = () => {
  if (page.value > 1) {
    page.value--
  }
}

const nextPage = () => {
  if (page.value < numPages.value) {
    page.value++
  }
}

// Métodos de zoom
const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 3.0)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

// Handlers de eventos
const onLoaded = pdf => {
  console.log('✅ PDF loaded successfully:', pdf)
  numPages.value = pdf.numPages
  loading.value = false
  error.value = null
  emit('loaded', pdf)
}

const onError = err => {
  console.error('❌ PDF loading failed:', err)
  loading.value = false
  error.value = err.message || err.toString() || 'Error desconocido'
  emit('error', err)
}

const onProgress = progressData => {
  console.log('📊 PDF loading progress:', progressData)
}

const retryLoad = () => {
  console.log('🔄 Retrying PDF load')
  loading.value = true
  error.value = null
  
  // Trigger reactivity
  const currentSrc = props.src
  
  setTimeout(() => {
    if (currentSrc === props.src) {
      loading.value = false
    }
  }, 3000)
}

// Inicializar cuando se monta el componente
onMounted(() => {
  console.log('📄 WorkingPdfViewer mounted with src:', props.src, 'type:', getSrcType())
  
  if (props.src) {
    loading.value = true
    
    // Timeout de seguridad para evitar carga infinita
    setTimeout(() => {
      if (loading.value && !error.value && numPages.value === 0) {
        console.warn('⚠️ PDF loading timeout, setting error')
        onError(new Error('Timeout: El PDF no se cargó en tiempo esperado'))
      }
    }, 10000) // 10 seconds timeout
  }
})

// Watcher para cambios en src
watch(() => props.src, (newSrc, oldSrc) => {
  console.log('🔄 PDF src changed:', { oldSrc, newSrc, type: getSrcType() })
  
  if (newSrc) {
    loading.value = true
    error.value = null
    page.value = 1
    numPages.value = 0
  } else {
    loading.value = false
    error.value = null
    page.value = 1
    numPages.value = 0
  }
}, { immediate: true })
</script>

<style scoped>
.working-pdf-viewer {
  block-size: 100%;
  inline-size: 100%;
}

.pdf-container {
  block-size: 100%;
  inline-size: 100%;
}

.pdf-display {
  overflow: auto;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f5f5f5;
  inline-size: 100%;
  max-block-size: 600px;
}

.pdf-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-block-size: 400px;
}

.debug-info {
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
  font-family: monospace;
}
</style>
