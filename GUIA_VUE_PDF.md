# 📚 Guía Completa: @tato30/vue-pdf

## 🎯 Introducción

`@tato30/vue-pdf` es una librería moderna para Vue 3 que permite visualizar documentos PDF directamente en tu aplicación web. Esta guía te mostrará cómo implementarla paso a paso en tu proyecto.

## 📦 Instalación

### Paso 1: Instalar la librería

```bash
# Con pnpm (recomendado para este proyecto)
pnpm add @tato30/vue-pdf

# Con npm
npm install @tato30/vue-pdf

# Con yarn
yarn add @tato30/vue-pdf
```

## 🛠️ Configuración

### Paso 2: Configurar el Worker (Opcional pero recomendado)

Crea un archivo de configuración para PDF.js:

```javascript
// src/utils/pdf-config.js
import * as pdfjsLib from 'pdfjs-dist'

// Configurar el worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

export default pdfjsLib
```

## 🎨 Componentes Creados

### 1. PdfViewer.vue - Componente Principal

**Ubicación:** `src/components/PdfViewer.vue`

**Características:**
- ✅ Navegación entre páginas
- ✅ Control de zoom
- ✅ Barra de herramientas integrada
- ✅ Manejo de errores
- ✅ Estado de carga
- ✅ Responsive design
- ✅ Compatible con Vuetify

**Props:**
```typescript
interface Props {
  src: string | Object | Uint8Array  // Fuente del PDF
  initialPage?: number               // Página inicial (default: 1)
  initialScale?: number              // Escala inicial (default: 1.0)
}
```

**Eventos:**
```typescript
interface Emits {
  loaded: (pdf: PDFDocumentProxy) => void    // PDF cargado exitosamente
  error: (error: Error) => void              // Error al cargar
  pageChange: (page: number) => void         // Cambio de página
}
```

**Métodos Expuestos:**
```typescript
interface ExposedMethods {
  goToPage: (page: number) => void           // Ir a página específica
  setScale: (scale: number) => void          // Cambiar escala
  getCurrentPage: () => number               // Obtener página actual
  getTotalPages: () => number                // Obtener total de páginas
  getScale: () => number                     // Obtener escala actual
}
```

### 2. PdfViewerModal.vue - Modal para PDFs

**Ubicación:** `src/components/PdfViewerModal.vue`

**Características:**
- ✅ Modal responsive
- ✅ Botón de descarga
- ✅ Estados de carga y error
- ✅ Integración con el sistema de traducción
- ✅ Compatible con el sistema de armas

**Props:**
```typescript
interface Props {
  modelValue: boolean     // Control de visibilidad
  pdfUrl?: string        // URL del PDF
  armaName?: string      // Nombre del arma para el título
}
```

## 📋 Ejemplos de Uso

### Ejemplo 1: Uso Básico con URL

```vue
<template>
  <PdfViewer
    src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"
    :initial-page="1"
    :initial-scale="1.0"
    @loaded="onPdfLoaded"
    @error="onPdfError"
    style="height: 80vh;"
  />
</template>

<script setup>
import PdfViewer from '@/components/PdfViewer.vue'

const onPdfLoaded = (pdf) => {
  console.log('PDF cargado:', pdf.numPages, 'páginas')
}

const onPdfError = (error) => {
  console.error('Error:', error)
}
</script>
```

### Ejemplo 2: Carga desde Archivo Local

```vue
<template>
  <div>
    <VFileInput
      v-model="selectedFile"
      label="Seleccionar PDF"
      accept=".pdf"
      @update:model-value="handleFileSelect"
    />
    
    <PdfViewer
      v-if="pdfSrc"
      :src="pdfSrc"
      style="height: 70vh; margin-top: 20px;"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PdfViewer from '@/components/PdfViewer.vue'

const selectedFile = ref(null)
const pdfSrc = ref(null)

const handleFileSelect = (files) => {
  if (files && files.length > 0) {
    const file = files[0]
    const reader = new FileReader()
    
    reader.onload = (e) => {
      pdfSrc.value = new Uint8Array(e.target.result)
    }
    
    reader.readAsArrayBuffer(file)
  }
}
</script>
```

### Ejemplo 3: Uso Directo del Componente VuePDF

```vue
<template>
  <div>
    <!-- Controles personalizados -->
    <div class="controls">
      <VBtn @click="previousPage" :disabled="page <= 1">
        Anterior
      </VBtn>
      
      <span>{{ page }} / {{ numPages }}</span>
      
      <VBtn @click="nextPage" :disabled="page >= numPages">
        Siguiente
      </VBtn>
    </div>

    <!-- Visor PDF directo -->
    <VuePDF
      :pdf="pdf"
      :page="page"
      :scale="scale"
      @loading-success="onLoadingSuccess"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { VuePDF } from '@tato30/vue-pdf'
import pdfjsLib from '@/utils/pdf-config'

const pdf = ref(null)
const page = ref(1)
const numPages = ref(0)
const scale = ref(1.0)

onMounted(async () => {
  const pdfUrl = 'path/to/your/pdf.pdf'
  pdf.value = pdfjsLib.getDocument(pdfUrl)
})

const onLoadingSuccess = (pdfDoc) => {
  numPages.value = pdfDoc.numPages
}

const previousPage = () => page.value > 1 && page.value--
const nextPage = () => page.value < numPages.value && page.value++
</script>
```

### Ejemplo 4: Integración con Modal

```vue
<template>
  <div>
    <!-- Botón para abrir PDF -->
    <VBtn @click="openPdfViewer">
      Ver Documento PDF
    </VBtn>

    <!-- Modal con visor PDF -->
    <PdfViewerModal
      v-model="showPdfModal"
      :pdf-url="pdfUrl"
      :arma-name="armaName"
      @pdf-loaded="onPdfLoaded"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import PdfViewerModal from '@/components/PdfViewerModal.vue'

const showPdfModal = ref(false)
const pdfUrl = ref('https://example.com/document.pdf')
const armaName = ref('AK-47')

const openPdfViewer = () => {
  showPdfModal.value = true
}

const onPdfLoaded = (pdf) => {
  console.log('PDF cargado en modal:', pdf)
}
</script>
```

## 🔧 Integración en el Sistema de Armas

### Paso 1: Agregar el Modal al Sistema Principal

En tu archivo `src/pages/pages/parametricas/armas/list/index.vue`, agrega:

```vue
<script setup>
// ... imports existentes
import PdfViewerModal from '@/components/PdfViewerModal.vue'

// ... variables existentes

// Variables para el visor PDF
const showPdfModal = ref(false)
const currentPdfUrl = ref('')
const currentArmaName = ref('')

// Función para abrir el visor PDF
const openPdfViewer = (arma) => {
  if (arma.pdf_url) {
    currentPdfUrl.value = arma.pdf_url
    currentArmaName.value = arma.nombre
    showPdfModal.value = true
  } else {
    // Mostrar mensaje de error
    errorMessage.value = 'Este arma no tiene un documento PDF asociado'
    showErrorModal.value = true
  }
}
</script>

<template>
  <!-- ... contenido existente ... -->

  <!-- Agregar en la sección de modales al final -->
  <PdfViewerModal
    v-model="showPdfModal"
    :pdf-url="currentPdfUrl"
    :arma-name="currentArmaName"
    @pdf-loaded="onPdfLoaded"
  />
</template>
```

### Paso 2: Agregar Botón en la Tabla

En las acciones de la tabla, agrega un botón para ver PDF:

```vue
<!-- En la columna de acciones de la tabla -->
<template #item.actions="{ item }">
  <div class="d-flex gap-1">
    <!-- ... botones existentes ... -->
    
    <!-- Botón para ver PDF -->
    <VBtn
      icon
      size="x-small"
      color="info"
      variant="text"
      :disabled="!item.pdf_url"
      @click="openPdfViewer(item)"
    >
      <VIcon
        size="22"
        icon="mdi-file-pdf-box"
      />
      <VTooltip
        activator="parent"
        location="top"
      >
        {{ t('viewPdf') }}
      </VTooltip>
    </VBtn>
  </div>
</template>
```

## 🌐 Tipos de Fuentes Soportadas

### 1. URL Externa
```javascript
const pdfSrc = 'https://example.com/document.pdf'
```

### 2. URL de Blob
```javascript
const blob = new Blob([pdfData], { type: 'application/pdf' })
const pdfSrc = URL.createObjectURL(blob)
```

### 3. ArrayBuffer/Uint8Array
```javascript
// Desde FileReader
reader.onload = (e) => {
  const pdfSrc = new Uint8Array(e.target.result)
}
```

### 4. Base64
```javascript
const pdfSrc = 'data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoKMiAwIG9iago...'
```

## 🎨 Personalización de Estilos

### Personalizar la Barra de Herramientas

```vue
<style scoped>
.pdf-toolbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pdf-toolbar .v-btn {
  color: white;
}
</style>
```

### Personalizar el Contenedor del PDF

```vue
<style scoped>
.pdf-content {
  background: #f8f9fa;
  border-radius: 12px;
}

.pdf-page {
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
</style>
```

## 📱 Consideraciones para Móviles

### Responsive Design
Los componentes están optimizados para dispositivos móviles:

- ✅ Controles táctiles
- ✅ Zoom pinch-to-zoom
- ✅ Navegación por gestos
- ✅ Interfaz adaptativa

### Ejemplo de Breakpoints

```vue
<script setup>
import { useDisplay } from 'vuetify'

const { mobile, tablet } = useDisplay()
</script>

<template>
  <PdfViewer
    :src="pdfSrc"
    :initial-scale="mobile ? 0.8 : 1.0"
    :style="{
      height: mobile ? '60vh' : '80vh',
      'margin-top': mobile ? '8px' : '16px'
    }"
  />
</template>
```

## 🚨 Manejo de Errores

### Errores Comunes y Soluciones

1. **CORS Error**
   ```javascript
   // Configurar headers en el servidor
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   ```

2. **Worker no encontrado**
   ```javascript
   // Configurar el worker correctamente
   import * as pdfjsLib from 'pdfjs-dist'
   pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
   ```

3. **PDF corrupto**
   ```vue
   <script setup>
   const onPdfError = (error) => {
     if (error.name === 'InvalidPDFException') {
       alert('El archivo PDF está corrupto o no es válido')
     } else if (error.name === 'MissingPDFException') {
       alert('No se pudo encontrar el archivo PDF')
     } else {
       alert('Error al cargar el PDF: ' + error.message)
     }
   }
   </script>
   ```

## 🔧 Configuración Avanzada

### Configurar PDF.js Worker Localmente

1. Descargar el worker:
```bash
# Copiar worker a public
cp node_modules/pdfjs-dist/build/pdf.worker.min.js public/
```

2. Configurar la ruta:
```javascript
import * as pdfjsLib from 'pdfjs-dist'
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
```

### Configuración de Memoria

```javascript
// Para PDFs grandes
import * as pdfjsLib from 'pdfjs-dist'

pdfjsLib.GlobalWorkerOptions.workerSrc = 'path/to/worker.js'

// Configurar límites de memoria
const loadingTask = pdfjsLib.getDocument({
  url: pdfUrl,
  maxImageSize: 1024 * 1024, // 1MB
  disableFontFace: false,
  disableRange: false,
  disableStream: false
})
```

## 📊 Performance y Optimización

### Lazy Loading
```vue
<template>
  <div>
    <VBtn @click="loadPdf">Cargar PDF</VBtn>
    
    <PdfViewer
      v-if="pdfSrc"
      :src="pdfSrc"
    />
  </div>
</template>

<script setup>
const pdfSrc = ref(null)

const loadPdf = () => {
  // Cargar solo cuando se necesite
  pdfSrc.value = 'path/to/large-pdf.pdf'
}
</script>
```

### Preload para PDFs Críticos
```vue
<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // Precargar PDFs importantes
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = 'path/to/important.pdf'
  document.head.appendChild(link)
})
</script>
```

## 🧪 Testing

### Test del Componente PdfViewer

```javascript
// tests/PdfViewer.test.js
import { mount } from '@vue/test-utils'
import PdfViewer from '@/components/PdfViewer.vue'

describe('PdfViewer', () => {
  it('renders correctly with PDF URL', () => {
    const wrapper = mount(PdfViewer, {
      props: {
        src: 'test.pdf',
        initialPage: 1,
        initialScale: 1.0
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
  
  it('emits loaded event when PDF loads', async () => {
    const wrapper = mount(PdfViewer, {
      props: { src: 'test.pdf' }
    })
    
    // Simular carga exitosa
    await wrapper.vm.onLoadingSuccess({ numPages: 5 })
    
    expect(wrapper.emitted('loaded')).toBeTruthy()
  })
})
```

## 📚 API Reference

### VuePDF Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pdf` | `Object` | `null` | PDF loading task |
| `page` | `Number` | `1` | Página actual |
| `scale` | `Number` | `1.0` | Escala del PDF |
| `rotate` | `Number` | `0` | Rotación en grados |

### VuePDF Component Events

| Event | Payload | Description |
|-------|---------|-------------|
| `loading-success` | `PDFDocumentProxy` | PDF cargado exitosamente |
| `loading-failed` | `Error` | Error al cargar PDF |
| `progress` | `ProgressData` | Progreso de carga |

## 🔍 Troubleshooting

### Problemas Comunes

1. **PDF no se muestra**
   - Verificar que la URL sea accesible
   - Comprobar CORS headers
   - Validar que el archivo sea un PDF válido

2. **Worker errors**
   - Configurar correctamente el worker path
   - Usar CDN o archivo local

3. **Performance lenta**
   - Implementar lazy loading
   - Usar menor resolución inicial
   - Configurar límites de memoria

### Debug Mode

```vue
<script setup>
const debugMode = ref(true)

const onProgress = (progress) => {
  if (debugMode.value) {
    console.log('PDF Progress:', progress)
  }
}

const onPdfLoaded = (pdf) => {
  if (debugMode.value) {
    console.log('PDF Info:', {
      pages: pdf.numPages,
      fingerprint: pdf.fingerprint,
      info: pdf.info
    })
  }
}
</script>
```

## 🎉 ¡Listo para Usar!

Ahora tienes todo lo necesario para implementar un sistema completo de visualización de PDFs en tu aplicación Vue 3 con Vuetify. Los componentes están optimizados, son responsive y están completamente integrados con tu sistema de internacionalización.

### Próximos Pasos:

1. ✅ Instalar la librería
2. ✅ Usar los componentes creados
3. ✅ Integrar en tu sistema de armas
4. ✅ Personalizar según tus necesidades
5. ✅ Probar en diferentes dispositivos

¡Disfruta de tu nuevo sistema de visualización de PDFs! 🚀
