<template>
  <!-- Modal de Visor PDF -->
  <VDialog
    v-model="showPdfViewer"
    max-width="1200"
    persistent
    scrollable
  >
    <VCard>
      <VCardTitle class="d-flex align-center">
        <VIcon
          icon="mdi-file-pdf-box"
          class="me-2"
          color="error"
        />
        {{ t('pdfViewer') }} - {{ currentArmaName }}
        
        <VSpacer />
        
        <DialogCloseBtn @click="closePdfViewer" />
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-0">
        <div style="block-size: 70vh;">
          <!-- Visor PDF cuando hay URL -->
          <SimplePdfViewer 
            v-if="pdfUrl && !loadingPdf"
            :src="pdfUrl" 
          />
          
          <!-- Estado de carga -->
          <div
            v-else-if="loadingPdf"
            class="d-flex align-center justify-center"
            style="block-size: 100%;"
          >
            <VProgressCircular
              indeterminate
              color="primary"
              size="64"
            />
            <span class="ms-4">{{ t('loadingPdf') }}...</span>
          </div>
          
          <!-- Estado sin PDF -->
          <div
            v-else
            class="d-flex align-center justify-center flex-column"
            style="block-size: 100%;"
          >
            <VIcon
              icon="mdi-file-pdf-box"
              size="64"
              color="grey"
            />
            <p class="text-h6 mt-4">
              {{ t('noPdfSelected') }}
            </p>
          </div>
        </div>
      </VCardText>

      <VDivider />

      <VCardActions>
        <VSpacer />
        
        <!-- Botón para descargar -->
        <VBtn
          v-if="pdfUrl"
          variant="outlined"
          prepend-icon="mdi-download"
          @click="downloadPdf"
        >
          {{ t('download') }}
        </VBtn>
        
        <VBtn
          variant="outlined"
          @click="closePdfViewer"
        >
          {{ t('close') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script setup>
import DialogCloseBtn from '@/@core/components/DialogCloseBtn.vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SimplePdfViewer from './SimplePdfViewer.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pdfUrl: {
    type: String,
    default: null,
  },
  armaName: {
    type: String,
    default: '',
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'pdfLoaded', 'pdfError'])

// Composables
const { t } = useI18n()

// Estado reactivo
const showPdfViewer = ref(props.modelValue)
const currentArmaName = ref(props.armaName)
const loadingPdf = ref(false)

// Watchers
watch(() => props.modelValue, newValue => {
  showPdfViewer.value = newValue
})

watch(() => props.pdfUrl, async newUrl => {
  if (newUrl) {
    await loadPdf(newUrl)
  } else {
    currentPdfSrc.value = null
  }
})

watch(() => props.armaName, newName => {
  currentArmaName.value = newName
})

watch(showPdfViewer, newValue => {
  emit('update:modelValue', newValue)
})

// Métodos
const loadPdf = async pdfUrl => {
  try {
    loadingPdf.value = true

    // El TestPdfViewer manejará la carga del PDF
    console.log('Cargando PDF en modal:', pdfUrl)
  } catch (error) {
    console.error('Error al cargar PDF:', error)
    emit('pdfError', error)
  } finally {
    loadingPdf.value = false
  }
}

const closePdfViewer = () => {
  showPdfViewer.value = false
}

const downloadPdf = () => {
  if (props.pdfUrl) {
    const link = document.createElement('a')
    
    link.href = props.pdfUrl
    link.download = `${currentArmaName.value || 'documento'}.pdf`
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Handlers de eventos del PDF
const onPdfLoaded = pdf => {
  console.log('PDF cargado en modal:', pdf)
  emit('pdfLoaded', pdf)
}

const onPdfError = error => {
  console.error('Error en PDF modal:', error)
  emit('pdfError', error)
}
</script>
