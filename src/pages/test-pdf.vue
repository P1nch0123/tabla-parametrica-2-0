<template>
  <VContainer>
    <VRow>
      <VCol cols="12">
        <h2>Prueba del Visor PDF</h2>
        
        <VCard>
          <VCardText>
            <div class="d-flex gap-4 mb-4">
              <VBtn
                color="primary"
                @click="generateAndShowPDF"
              >
                Generar y Mostrar PDF
              </VBtn>
              
              <VBtn
                color="secondary"
                @click="testPdfUrl"
              >
                Probar PDF desde URL
              </VBtn>
            </div>

            <!-- Visor PDF simple -->
            <div v-if="pdfSrc">
              <h3>Visor PDF:</h3>
              <SimplePdfViewer
                :src="pdfSrc"
                @loaded="onPdfLoaded"
                @error="onPdfError"
              />
            </div>
            
            <!-- Modal del visor -->
            <PdfViewerModal
              v-model="showModal"
              :pdf-url="modalPdfUrl"
              arma-name="Prueba PDF"
              @pdf-loaded="onModalPdfLoaded"
              @pdf-error="onModalPdfError"
            />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import PdfViewerModal from '@/components/PdfViewerModal.vue'
import SimplePdfViewer from '@/components/SimplePdfViewer.vue'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { ref } from 'vue'

// Estado reactivo
const pdfSrc = ref(null)
const showModal = ref(false)
const modalPdfUrl = ref(null)

// Función para generar PDF de prueba
const generateAndShowPDF = async () => {
  try {
    console.log('Generando PDF de prueba...')
    
    // Crear PDF simple
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text('Reporte de Prueba', 20, 30)
    
    doc.setFontSize(12)
    doc.text('Este es un PDF generado con jsPDF para probar el visor.', 20, 50)
    
    // Agregar una tabla simple
    doc.autoTable({
      head: [['ID', 'Nombre', 'Descripción']],
      body: [
        [1, 'Elemento 1', 'Descripción del elemento 1'],
        [2, 'Elemento 2', 'Descripción del elemento 2'],
        [3, 'Elemento 3', 'Descripción del elemento 3'],
      ],
      startY: 70,
    })
    
    // Convertir a blob
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    console.log('PDF generado, URL:', pdfUrl)
    
    // Mostrar en el visor directo
    pdfSrc.value = pdfUrl
    
    // También preparar para el modal
    modalPdfUrl.value = pdfUrl
    
  } catch (error) {
    console.error('Error al generar PDF:', error)
  }
}

// Función para probar PDF desde URL externa
const testPdfUrl = () => {
  // PDF de prueba de Mozilla
  const testUrl = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  
  pdfSrc.value = testUrl
  modalPdfUrl.value = testUrl
  showModal.value = true
}

// Handlers de eventos
const onPdfLoaded = pdf => {
  console.log('PDF cargado en visor directo:', pdf)
}

const onPdfError = error => {
  console.error('Error en visor directo:', error)
}

const onModalPdfLoaded = pdf => {
  console.log('PDF cargado en modal:', pdf)
}

const onModalPdfError = error => {
  console.error('Error en modal:', error)
}
</script>
