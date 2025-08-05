<template>
  <VContainer>
    <VRow>
      <VCol cols="12">
        <h2>Ejemplo 3: Uso Directo de VuePDF</h2>
        
        <VCard>
          <VCardText>
            <!-- Controles simples -->
            <div class="d-flex align-center mb-4">
              <VBtn
                variant="outlined"
                size="small"
                :disabled="page <= 1"
                @click="page--"
              >
                Anterior
              </VBtn>
              
              <VTextField
                v-model.number="page"
                type="number"
                :min="1"
                :max="numPages"
                density="compact"
                hide-details
                style="inline-size: 80px;"
                class="mx-2"
              />
              
              <span>/ {{ numPages }}</span>
              
              <VBtn
                variant="outlined"
                size="small"
                :disabled="page >= numPages"
                class="ms-2"
                @click="page++"
              >
                Siguiente
              </VBtn>
              
              <VSpacer />
              
              <!-- Control de escala -->
              <VSlider
                v-model="scale"
                :min="0.5"
                :max="2.0"
                :step="0.1"
                density="compact"
                style="inline-size: 150px;"
                class="me-2"
              />
              <span>{{ Math.round(scale * 100) }}%</span>
            </div>

            <!-- Visor PDF directo -->
            <div class="pdf-container">
              <VuePDF
                :pdf="pdf"
                :page="page"
                :scale="scale"
                @loading-success="onLoadingSuccess"
                @loading-failed="onLoadingFailed"
                @progress="onProgress"
              />
            </div>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import { VuePDF } from '@tato30/vue-pdf'
import * as pdfjsLib from 'pdfjs-dist'
import { onMounted, ref } from 'vue'

// Configurar worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

// Estado reactivo  
const pdf = ref(null)
const page = ref(1)
const numPages = ref(0)
const scale = ref(1.0)

// Cargar PDF al montar el componente
onMounted(async () => {
  try {
    // URL de ejemplo
    const pdfUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
    
    // Crear tarea de carga usando PDF.js directamente
    const loadingTask = pdfjsLib.getDocument(pdfUrl)
    
    pdf.value = loadingTask
  } catch (error) {
    console.error('Error al cargar PDF:', error)
  }
})

// Handlers de eventos
const onLoadingSuccess = pdfDoc => {
  numPages.value = pdfDoc.numPages
  console.log('PDF cargado exitosamente')
}

const onLoadingFailed = error => {
  console.error('Error de carga:', error)
}

const onProgress = progress => {
  console.log('Progreso:', progress)
}
</script>

<style scoped>
.pdf-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-radius: 8px;
  background-color: #f5f5f5;
  min-block-size: 500px;
}
</style>
