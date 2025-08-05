<template>
  <VContainer>
    <VRow>
      <VCol cols="12">
        <h2>Visor PDF Básico - @tato30/vue-pdf</h2>
        
        <VCard>
          <VCardText>
            <div class="mb-4">
              <VBtn
                color="primary"
                @click="loadTestPdf"
              >
                Cargar PDF de Prueba
              </VBtn>
              
              <VBtn
                color="secondary"
                class="ms-2"
                @click="generatePdf"
              >
                Generar PDF Local
              </VBtn>
            </div>

            <!-- Visor básico -->
            <div v-if="pdfSrc">
              <div class="d-flex align-center mb-2">
                <VBtn
                  icon="mdi-chevron-left"
                  variant="outlined"
                  size="small"
                  :disabled="page <= 1"
                  @click="page--"
                />
                
                <span class="mx-3">Página {{ page }} / {{ numPages }}</span>
                
                <VBtn
                  icon="mdi-chevron-right"
                  variant="outlined"
                  size="small"
                  :disabled="page >= numPages"
                  @click="page++"
                />
              </div>
              
              <div class="pdf-container">
                <VuePDF
                  :src="pdfSrc"
                  :page="page"
                  :scale="scale"
                  @loaded="onLoaded"
                  @loading-failed="onError"
                  @progress="onProgress"
                />
              </div>
            </div>
            
            <div v-else>
              <p>No hay PDF cargado</p>
            </div>
            
            <!-- Log de eventos -->
            <div
              v-if="logs.length > 0"
              class="mt-4"
            >
              <h4>Log de eventos:</h4>
              <VAlert
                v-for="(log, index) in logs"
                :key="index"
                :type="log.type"
                class="mb-2"
                :text="log.message"
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
import { jsPDF } from 'jspdf'
import { ref } from 'vue'

// Estado reactivo
const pdfSrc = ref(null)
const page = ref(1)
const numPages = ref(0)
const scale = ref(1.0)
const logs = ref([])

// Funciones
const addLog = (type, message) => {
  logs.value.push({ type, message })
  console.log(`[${type.toUpperCase()}]`, message)
}

const loadTestPdf = () => {
  addLog('info', 'Cargando PDF de prueba desde URL externa...')
  pdfSrc.value = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  page.value = 1
}

const generatePdf = () => {
  try {
    addLog('info', 'Generando PDF con jsPDF...')
    
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text('PDF Generado Localmente', 20, 30)
    
    doc.setFontSize(12)
    doc.text('Este PDF fue creado usando jsPDF.', 20, 50)
    doc.text('Fecha: ' + new Date().toLocaleDateString(), 20, 70)
    
    // Crear blob y URL
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    addLog('success', 'PDF generado exitosamente')
    
    pdfSrc.value = pdfUrl
    page.value = 1
    
  } catch (error) {
    addLog('error', 'Error al generar PDF: ' + error.message)
  }
}

// Handlers de eventos del PDF
const onLoaded = pdf => {
  numPages.value = pdf.numPages
  addLog('success', `PDF cargado exitosamente. Total de páginas: ${pdf.numPages}`)
}

const onError = error => {
  addLog('error', 'Error al cargar PDF: ' + error.message)
}

const onProgress = progressData => {
  addLog('info', `Progreso de carga: ${JSON.stringify(progressData)}`)
}
</script>

<style scoped>
.pdf-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f5f5f5;
  min-block-size: 400px;
}
</style>
