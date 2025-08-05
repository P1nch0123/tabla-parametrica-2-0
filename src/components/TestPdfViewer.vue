<template>
  <div style=" padding: 20px; border: 1px solid #ccc; block-size: 600px;inline-size: 100%;">
    <h3>Visor PDF - @tato30/vue-pdf</h3>
    
    <!-- Estado de carga -->
    <div
      v-if="isLoading"
      style=" padding: 50px;text-align: center;"
    >
      <div>⏳ Cargando PDF...</div>
      <div style=" color: #666;font-size: 12px; margin-block-start: 10px;">
        Tipo de fuente: {{ getSourceType() }}
      </div>
    </div>
    
    <!-- Error -->
    <div
      v-else-if="error"
      style=" padding: 50px; color: red;text-align: center;"
    >
      <div>❌ Error al cargar PDF</div>
      <div style="font-size: 12px; margin-block-start: 10px;">
        {{ error }}
      </div>
      <button
        style="margin-block-start: 10px; padding-block: 5px; padding-inline: 15px;"
        @click="retryLoad"
      >
        🔄 Reintentar
      </button>
    </div>
    
    <!-- PDF Cargado exitosamente -->
    <div v-else>
      <!-- Controles -->
      <div style="display: flex; align-items: center; padding: 10px; border-radius: 5px; background: #f5f5f5; gap: 10px; margin-block-end: 20px;">
        <button 
          :disabled="currentPage <= 1" 
          style="padding-block: 5px;padding-inline: 10px;"
          @click="previousPage"
        >
          ◀ Anterior
        </button>
        
        <span style="min-inline-size: 80px; text-align: center;">
          {{ currentPage }} / {{ numPages }}
        </span>
        
        <button 
          :disabled="currentPage >= numPages" 
          style="padding-block: 5px;padding-inline: 10px;"
          @click="nextPage"
        >
          Siguiente ▶
        </button>
        
        <div style="margin-inline-start: 20px;">
          |
        </div>
        
        <button
          style="padding-block: 5px;padding-inline: 10px;"
          @click="zoomOut"
        >
          🔍-
        </button>
        <span style="min-inline-size: 60px; text-align: center;">{{ Math.round(scale * 100) }}%</span>
        <button
          style="padding-block: 5px;padding-inline: 10px;"
          @click="zoomIn"
        >
          🔍+
        </button>
      </div>
      
      <!-- Contenedor del PDF -->
      <div style=" overflow: auto; padding: 10px;border: 1px solid #ddd; background: #f9f9f9; block-size: 450px; text-align: center;">
        <VuePDF
          :src="pdfSource"
          :page="currentPage"
          :scale="scale"
          style="display: inline-block;"
          @loaded="onPdfLoaded"
          @loading-failed="onPdfError"
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
    required: true,
  },
})

// Estados reactivos
const isLoading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const numPages = ref(0)
const scale = ref(1.0)

// Copia local del src para control interno
const pdfSource = ref(null)

// Métodos utilitarios
const getSourceType = () => {
  if (!props.src) return 'null'
  if (typeof props.src === 'string') {
    if (props.src.startsWith('blob:')) return 'Blob URL'
    if (props.src.startsWith('http')) return 'HTTP URL'
    
    return 'String'
  }
  
  return typeof props.src
}

// Handlers de eventos del PDF
const onPdfLoaded = pdfProxy => {
  console.log('✅ PDF cargado exitosamente:', pdfProxy)
  isLoading.value = false
  error.value = null
  numPages.value = pdfProxy.numPages
  
  // Reset a la primera página
  currentPage.value = 1
}

const onPdfError = errorInfo => {
  console.error('❌ Error al cargar PDF:', errorInfo)
  isLoading.value = false
  error.value = errorInfo.message || 'Error desconocido al cargar PDF'
}

// Métodos de navegación
const nextPage = () => {
  if (currentPage.value < numPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// Métodos de zoom
const zoomIn = () => {
  scale.value = Math.min(scale.value + 0.25, 2.5)
}

const zoomOut = () => {
  scale.value = Math.max(scale.value - 0.25, 0.5)
}

// Reintentar carga
const retryLoad = () => {
  console.log('🔄 Reintentando carga del PDF...')
  isLoading.value = true
  error.value = null
  currentPage.value = 1
  numPages.value = 0
  
  // Reasignar el source para forzar recarga
  pdfSource.value = null
  setTimeout(() => {
    pdfSource.value = props.src
  }, 100)
}

// Watcher para cambios en src
watch(() => props.src, newSrc => {
  console.log('📄 Nueva fuente PDF recibida:', newSrc, 'Tipo:', getSourceType())
  
  if (newSrc) {
    isLoading.value = true
    error.value = null
    currentPage.value = 1
    numPages.value = 0
    pdfSource.value = newSrc
  }
}, { immediate: true })

// Configuración inicial
onMounted(() => {
  console.log('🚀 Componente PDF montado, iniciando con src:', props.src)
})
</script>
