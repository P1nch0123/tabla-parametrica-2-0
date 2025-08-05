<template>
  <VContainer>
    <VRow>
      <VCol cols="12">
        <h2>Ejemplo 1: PDF desde URL</h2>
        
        <!-- Componente PDF Viewer -->
        <PdfViewer
          src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
          :initial-page="1"
          :initial-scale="1.0"
          style="block-size: 80vh;"
          @loaded="onPdfLoaded"
          @error="onPdfError"
          @page-change="onPageChange"
        />
      </VCol>
    </VRow>
  </VContainer>
</template>

<script setup>
import PdfViewer from '@/components/PdfViewer.vue'

// Handlers de eventos
const onPdfLoaded = pdf => {
  console.log('PDF cargado:', pdf)
  console.log('Total de páginas:', pdf.numPages)
}

const onPdfError = error => {
  console.error('Error al cargar PDF:', error)
}

const onPageChange = page => {
  console.log('Página cambiada a:', page)
}
</script>
