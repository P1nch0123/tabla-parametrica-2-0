<template>
  <div class="pdf-viewer-container">
    <!-- Barra de herramientas -->
    <div class="pdf-toolbar">
      <VBtn
        prepend-icon="mdi-chevron-left"
        variant="outlined"
        size="small"
        :disabled="currentPage <= 1"
        @click="goToPreviousPage"
      >
        Anterior
      </VBtn>
      
      <VChip class="mx-2">
        {{ currentPage }} / {{ totalPages }}
      </VChip>
      
      <VBtn
        append-icon="mdi-chevron-right"
        variant="outlined"
        size="small"
        :disabled="currentPage >= totalPages"
        @click="goToNextPage"
      >
        Siguiente
      </VBtn>

      <VSpacer />

      <!-- Controles de zoom -->
      <VBtn
        icon="mdi-magnify-minus"
        variant="outlined"
        size="small"
        class="me-2"
        @click="zoomOut"
      />
      
      <VChip class="mx-2">
        {{ Math.round(scale * 100) }}%
      </VChip>
      
      <VBtn
        icon="mdi-magnify-plus"
        variant="outlined"
        size="small"
        @click="zoomIn"
      />
    </div>

    <!-- Visor PDF -->
    <VCard class="pdf-content">
      <VProgressLinear
        v-if="loading"
        indeterminate
        color="primary"
      />
      
      <div
        v-if="error"
        class="error-message pa-4"
      >
        <VAlert
          type="error"
          :text="error"
        />
      </div>

      <div
        v-else
        class="pdf-display"
      >
        <VuePDF
          v-if="pdfSrc"
          :src="pdfSrc"
          :page="currentPage"
          :scale="scale"
          class="pdf-page"
          @loaded="onLoadingSuccess"
          @loading-failed="onLoadingFailed"
          @progress="onProgress"
        />
      </div>
    </VCard>
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
  initialPage: {
    type: Number,
    default: 1,
  },
  initialScale: {
    type: Number,
    default: 1.0,
  },
})

// Emits
const emit = defineEmits(['loaded', 'error', 'pageChange'])

// Estado reactivo
const pdfSrc = ref(props.src)
const currentPage = ref(props.initialPage)
const totalPages = ref(0)
const scale = ref(props.initialScale)
const loading = ref(false)
const error = ref(null)

// Métodos de navegación
const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    emit('pageChange', currentPage.value)
  }
}

const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    emit('pageChange', currentPage.value)
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
const onLoadingSuccess = pdf => {
  totalPages.value = pdf.numPages
  error.value = null
  loading.value = false
  emit('loaded', pdf)
}

const onLoadingFailed = err => {
  error.value = 'Error al cargar el PDF: ' + err.message
  loading.value = false
  emit('error', err)
}

const onProgress = progressData => {
  // Opcional: mostrar progreso de carga
  console.log('Progreso de carga:', progressData)
}

// Cargar PDF cuando cambia la fuente
const loadPDF = () => {
  if (!props.src) {
    pdfSrc.value = null
    
    return
  }
  
  loading.value = true
  error.value = null
  pdfSrc.value = props.src
}

// Watchers
watch(() => props.src, loadPDF, { immediate: true })

// Métodos públicos expuestos
defineExpose({
  goToPage: page => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      emit('pageChange', page)
    }
  },
  setScale: newScale => {
    scale.value = Math.max(0.5, Math.min(3.0, newScale))
  },
  getCurrentPage: () => currentPage.value,
  getTotalPages: () => totalPages.value,
  getScale: () => scale.value,
})
</script>

<style scoped>
.pdf-viewer-container {
  display: flex;
  flex-direction: column;
  block-size: 100%;
  inline-size: 100%;
}

.pdf-toolbar {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: rgb(0 0 0 / 2%);
  border-block-end: 1px solid rgb(0 0 0 / 12%);
}

.pdf-content {
  display: flex;
  overflow: auto;
  flex: 1;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
}

.pdf-page {
  box-shadow: 0 4px 6px rgb(0 0 0 / 10%);
  max-inline-size: 100%;
}

.error-message {
  inline-size: 100%;
}
</style>
