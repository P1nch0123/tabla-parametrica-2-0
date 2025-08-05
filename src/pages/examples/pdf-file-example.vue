<template>
  <VContainer>
    <VRow>
      <VCol cols="12">
        <h2>Ejemplo 2: Cargar PDF desde Archivo</h2>
        
        <!-- Input para seleccionar archivo -->
        <VFileInput
          v-model="selectedFile"
          label="Seleccionar archivo PDF"
          accept=".pdf"
          prepend-icon="mdi-file-pdf-box"
          @update:model-value="handleFileSelect"
        />

        <!-- Visor PDF -->
        <PdfViewer
          v-if="pdfSrc"
          :src="pdfSrc"
          style="block-size: 70vh; margin-block-start: 20px;"
          @loaded="onPdfLoaded"
          @error="onPdfError"
        />
        
        <!-- Estado vacío -->
        <VCard
          v-else
          class="d-flex align-center justify-center"
          style="block-size: 300px; margin-block-start: 20px;"
        >
          <div class="text-center">
            <VIcon
              icon="mdi-file-pdf-box"
              size="64"
              color="grey"
            />
            <p class="text-h6 mt-4">
              Selecciona un archivo PDF para visualizar
            </p>
          </div>
        </VCard>
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import PdfViewer from '@/components/PdfViewer.vue'
import { ref } from 'vue'

// Estado reactivo
const selectedFile = ref(null)
const pdfSrc = ref(null)

// Manejar selección de archivo
const handleFileSelect = files => {
  if (files && files.length > 0) {
    const file = files[0]
    
    // Verificar que sea un PDF
    if (file.type !== 'application/pdf') {
      alert('Por favor selecciona un archivo PDF válido')
      selectedFile.value = null
      
      return
    }
    
    // Crear ArrayBuffer para el PDF
    const reader = new FileReader()
    
    reader.onload = e => {
      pdfSrc.value = new Uint8Array(e.target.result)
    }
    reader.readAsArrayBuffer(file)
  } else {
    pdfSrc.value = null
  }
}

// Handlers de eventos
const onPdfLoaded = pdf => {
  console.log('PDF local cargado:', pdf)
}

const onPdfError = error => {
  console.error('Error al cargar PDF local:', error)
  alert('Error al cargar el archivo PDF: ' + error.message)
}
</script>
