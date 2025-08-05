<script setup>
import { saveAs } from 'file-saver'
import { default as jsPDF } from 'jspdf'
import { computed, onMounted, ref } from 'vue'
import VuePdfEmbed from 'vue-pdf-embed'
import * as XLSX from 'xlsx'

// Estados reactivos
const armas = ref([])
const selectedArmas = ref([])
const search = ref('')
const loading = ref(false)
const showPdfViewer = ref(false)
const pdfSrc = ref('')

// Datos simulados de armas
const armasData = [
  {
    id: 1,
    nombre: 'AK-47',
    tipo: 'Rifle de Asalto',
    calibre: '7.62x39mm',
    fabricante: 'Kalashnikov',
    peso: '4.3 kg',
    longitud: '870 mm',
    estado: 'Activo',
    fechaRegistro: '2025-01-15',
  },
  {
    id: 2,
    nombre: 'M4A1',
    tipo: 'Rifle de Asalto',
    calibre: '5.56x45mm',
    fabricante: 'Colt',
    peso: '3.4 kg',
    longitud: '838 mm',
    estado: 'Activo',
    fechaRegistro: '2025-01-20',
  },
  {
    id: 3,
    nombre: 'Glock 17',
    tipo: 'Pistola',
    calibre: '9x19mm',
    fabricante: 'Glock',
    peso: '0.625 kg',
    longitud: '186 mm',
    estado: 'Activo',
    fechaRegistro: '2025-02-01',
  },
  {
    id: 4,
    nombre: 'Barrett M82',
    tipo: 'Rifle de Francotirador',
    calibre: '.50 BMG',
    fabricante: 'Barrett',
    peso: '14 kg',
    longitud: '1219 mm',
    estado: 'Mantenimiento',
    fechaRegistro: '2025-02-10',
  },
  {
    id: 5,
    nombre: 'MP5',
    tipo: 'Subfusil',
    calibre: '9x19mm',
    fabricante: 'Heckler & Koch',
    peso: '2.54 kg',
    longitud: '680 mm',
    estado: 'Activo',
    fechaRegistro: '2025-02-15',
  },
]

// Computed para filtrar armas (con filtros avanzados)
const filteredArmas = computed(() => {
  return armasData.filter(arma => {
    // Filtro de búsqueda de texto
    const searchMatch = arma.nombre.toLowerCase().includes(search.value.toLowerCase()) ||
                       arma.tipo.toLowerCase().includes(search.value.toLowerCase()) ||
                       arma.fabricante.toLowerCase().includes(search.value.toLowerCase())
    
    // Filtros avanzados
    const tipoMatch = !selectedTipo.value || arma.tipo === selectedTipo.value
    const estadoMatch = !selectedEstado.value || arma.estado === selectedEstado.value
    const fabricanteMatch = !selectedFabricante.value || arma.fabricante === selectedFabricante.value
    
    // Filtro de fechas
    let dateMatch = true
    if (dateFrom.value || dateTo.value) {
      const armaDate = new Date(arma.fechaRegistro)
      if (dateFrom.value && armaDate < new Date(dateFrom.value)) dateMatch = false
      if (dateTo.value && armaDate > new Date(dateTo.value)) dateMatch = false
    }
    
    return searchMatch && tipoMatch && estadoMatch && fabricanteMatch && dateMatch
  })
})

// Headers para la tabla
const headers = [
  { title: 'ID', value: 'id', sortable: true },
  { title: 'Nombre', value: 'nombre', sortable: true },
  { title: 'Tipo', value: 'tipo', sortable: true },
  { title: 'Calibre', value: 'calibre', sortable: true },
  { title: 'Fabricante', value: 'fabricante', sortable: true },
  { title: 'Peso', value: 'peso', sortable: true },
  { title: 'Estado', value: 'estado', sortable: true },
  { title: 'Acciones', value: 'actions', sortable: false },
]

// Estados reactivos adicionales para PDF
const pdfBlob = ref(null)
const showPdfOptions = ref(false)
const pdfPages = ref(0)
const currentPage = ref(1)
const pdfData = ref(null)
const pdfError = ref(null)
const useIframe = ref(false) // Para cambiar entre VuePdfEmbed e iframe
const pdfDocument = ref(null) // Para almacenar el documento PDF

// === Nuevas funcionalidades avanzadas ===
// Estados para zoom y rotación (inicializado al 200%)
const pdfZoom = ref(2.0)
const pdfRotation = ref(0)

// Estados para filtros avanzados
const showAdvancedFilters = ref(false)
const dateFrom = ref('')
const dateTo = ref('')
const selectedTipo = ref('')
const selectedEstado = ref('')
const selectedFabricante = ref('')

// Estados para plantillas
const selectedTemplate = ref('standard')
const showTemplateDialog = ref(false)

// Estados para exportación
const showExportDialog = ref(false)
const exportFormat = ref('pdf')

// Opciones de filtros
const tiposArmas = ['Rifle de Asalto', 'Pistola', 'Rifle de Francotirador', 'Subfusil']
const estadosArmas = ['Activo', 'Mantenimiento', 'Inactivo']
const fabricantesArmas = ['Kalashnikov', 'Colt', 'Glock', 'Barrett', 'Heckler & Koch']

// Plantillas disponibles
const templates = [
  { value: 'standard', title: 'Reporte Estándar', description: 'Tabla básica con todos los campos' },
  { value: 'detailed', title: 'Reporte Detallado', description: 'Incluye gráficos y estadísticas' },
  { value: 'summary', title: 'Resumen Ejecutivo', description: 'Vista compacta con métricas clave' },
  { value: 'inventory', title: 'Control de Inventario', description: 'Enfoque en estado y mantenimiento' },
]

// Configuración para VuePdfEmbed
const pdfConfig = {
  page: currentPage,
  rotation: 0,
  scale: 1.5,
}

// Función para manejar cuando el PDF se carga
const onPdfLoaded = pdf => {
  pdfDocument.value = pdf
  pdfPages.value = pdf.numPages
  loading.value = false
  pdfError.value = null
  console.log('✅ PDF cargado exitosamente:', pdf.numPages, 'páginas')
}

// === Funciones para zoom y rotación ===
const zoomIn = () => {
  if (pdfZoom.value < 3.0) {
    pdfZoom.value = Math.round((pdfZoom.value + 0.25) * 100) / 100
    console.log('🔍 Zoom In:', pdfZoom.value)
  }
}

const zoomOut = () => {
  if (pdfZoom.value > 0.5) {
    pdfZoom.value = Math.round((pdfZoom.value - 0.25) * 100) / 100
    console.log('🔍 Zoom Out:', pdfZoom.value)
  }
}

const resetZoom = () => {
  pdfZoom.value = 2.0 // Resetear al zoom inicial del 200%
  console.log('🔍 Zoom Reset:', pdfZoom.value)
}

const rotateClockwise = () => {
  pdfRotation.value = (pdfRotation.value + 90) % 360
  console.log('🔄 Rotar:', pdfRotation.value)
}

const rotateCounterClockwise = () => {
  pdfRotation.value = (pdfRotation.value - 90 + 360) % 360
  console.log('🔄 Rotar:', pdfRotation.value)
}

const resetRotation = () => {
  pdfRotation.value = 0
  console.log('🔄 Rotación Reset:', pdfRotation.value)
}

// === Función para agregar marca de agua (simplificada) ===
const addWatermark = (doc, text = 'CONFIDENCIAL') => {
  try {
    const pageCount = doc.internal.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      
      // Configurar la marca de agua de forma simple
      doc.setTextColor(200, 200, 200) // Gris claro
      doc.setFontSize(40)
      doc.setFont('helvetica', 'bold')
      
      // Calcular posición central
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Posicionar en el centro de la página (diagonal simple)
      const x = pageWidth / 2
      const y = pageHeight / 2
      
      // Dibujar la marca de agua
      doc.text(text, x, y, { 
        align: 'center',
        angle: -45, // Rotación de 45 grados
      })
    }
    
    // Resetear color de texto
    doc.setTextColor(0, 0, 0)
  } catch (error) {
    console.warn('⚠️ No se pudo agregar marca de agua:', error.message)

    // Continuar sin marca de agua si hay error
  }
}

// Función para generar PDF personalizado con jsPDF
const generateCustomPDF = async () => {
  try {
    loading.value = true
    pdfError.value = null
    console.log('🚀 Iniciando generación de PDF personalizado...')

    const doc = new jsPDF()
    
    console.log('✅ jsPDF creado exitosamente')
    
    // Generar PDF según la plantilla seleccionada
    try {
      switch (selectedTemplate.value) {
      case 'detailed':
        console.log('📊 Generando PDF detallado...')
        generateDetailedPDF(doc)
        break
      case 'summary':
        console.log('📋 Generando resumen ejecutivo...')
        generateSummaryPDF(doc)
        break
      case 'inventory':
        console.log('📦 Generando control de inventario...')
        generateInventoryPDF(doc)
        break
      default:
        console.log('📄 Generando PDF estándar...')
        generateStandardPDF(doc)
      }
      console.log('✅ Contenido del PDF generado exitosamente')
    } catch (templateError) {
      console.error('❌ Error al generar contenido del PDF:', templateError)
      throw new Error(`Error en plantilla: ${templateError.message}`)
    }
    
    // Agregar marca de agua
    try {
      console.log('💧 Agregando marca de agua...')
      addWatermark(doc, 'REPORTE OFICIAL')
      console.log('✅ Marca de agua agregada')
    } catch (watermarkError) {
      console.warn('⚠️ Error al agregar marca de agua:', watermarkError)
      
      // Continuar sin marca de agua
    }
    
    console.log('📄 PDF generado, creando múltiples formatos...')
    
    // Generar el PDF en diferentes formatos para mayor compatibilidad
    const pdfOutput = doc.output('blob')
    const pdfArrayBuffer = doc.output('arraybuffer')
    const pdfDataUri = doc.output('datauristring')
    
    pdfBlob.value = pdfOutput
    pdfData.value = new Uint8Array(pdfArrayBuffer)
    
    console.log('📄 Blob creado:', pdfBlob.value)
    console.log('📄 ArrayBuffer creado:', pdfArrayBuffer)
    
    // Crear URL para el visor - probamos diferentes métodos
    const pdfUrl = URL.createObjectURL(pdfOutput)
    
    // Método 1: Usar el blob URL
    pdfSrc.value = pdfUrl
    
    console.log('🔗 URL del PDF:', pdfSrc.value)
    
    // Resetear página actual y zoom inicial
    currentPage.value = 1
    pdfPages.value = 0
    pdfZoom.value = 2.0 // Zoom inicial al 200%
    
    // Pequeña pausa para asegurar que el blob está listo
    await new Promise(resolve => setTimeout(resolve, 200))
    
    showPdfViewer.value = true
    loading.value = false
    
    console.log('✅ PDF personalizado generado exitosamente y visor abierto')
    
  } catch (error) {
    console.error('❌ Error al generar PDF:', error)
    console.error('❌ Stack trace:', error.stack)
    pdfError.value = error.message
    loading.value = false
    
    // Mostrar error al usuario con más detalles
    alert(`Error al generar PDF: ${error.message}\n\nRevisa la consola para más detalles.`)
  }
}

// === PDF Generation Functions ===

// Plantilla estándar
const generateStandardPDF = doc => {
  // Configuración del documento
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  
  // Título
  doc.text('REPORTE DE ARMAS PARAMETRICAS', 20, 30)
  
  // Información del reporte
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Fecha de generacion: ${new Date().toLocaleDateString('es-ES')}`, 20, 40)
  doc.text(`Total de armas: ${filteredArmas.value.length}`, 20, 45)
  
  // Encabezados de tabla
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  let yPosition = 60
  
  doc.text('ID', 20, yPosition)
  doc.text('NOMBRE', 35, yPosition)
  doc.text('TIPO', 70, yPosition)
  doc.text('CALIBRE', 105, yPosition)
  doc.text('FABRICANTE', 130, yPosition)
  doc.text('PESO', 165, yPosition)
  doc.text('ESTADO', 180, yPosition)
  
  // Línea separadora
  doc.line(20, yPosition + 2, 190, yPosition + 2)
  yPosition += 8
  
  // Datos de las armas
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  
  filteredArmas.value.forEach(arma => {
    if (yPosition > 270) { // Nueva página si es necesario
      doc.addPage()
      yPosition = 30
    }
    
    doc.text(arma.id.toString(), 20, yPosition)
    doc.text(arma.nombre, 35, yPosition)
    doc.text(arma.tipo, 70, yPosition)
    doc.text(arma.calibre, 105, yPosition)
    doc.text(arma.fabricante, 130, yPosition)
    doc.text(arma.peso, 165, yPosition)
    doc.text(arma.estado, 180, yPosition)
    
    yPosition += 8
  })
}

// Plantilla detallada con estadísticas
const generateDetailedPDF = doc => {
  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.text('REPORTE DETALLADO DE ARMAS', 20, 30)
  
  // Información del reporte
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 45)
  doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, 20, 55)
  
  // Estadísticas
  const stats = calculateStats()
  let yPos = 75
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('ESTADÍSTICAS GENERALES', 20, yPos)
  yPos += 15
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(`Total de armas: ${stats.total}`, 25, yPos)
  yPos += 10
  
  // Evitar división por cero
  const percentage = stats.total > 0 ? Math.round(stats.activas / stats.total * 100) : 0

  doc.text(`Armas activas: ${stats.activas} (${percentage}%)`, 25, yPos)
  yPos += 10
  doc.text(`En mantenimiento: ${stats.mantenimiento}`, 25, yPos)
  yPos += 10
  doc.text(`Fabricante más común: ${stats.fabricanteMasComun}`, 25, yPos)
  yPos += 10
  doc.text(`Tipo más común: ${stats.tipoMasComun}`, 25, yPos)
  yPos += 20
  
  // Tabla detallada
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text('LISTADO COMPLETO', 20, yPos)
  yPos += 15
  
  // Resto igual que la plantilla estándar
  generateStandardTable(doc, yPos)
}

// Plantilla resumen ejecutivo
const generateSummaryPDF = doc => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('RESUMEN EJECUTIVO - INVENTARIO DE ARMAS', 20, 30)
  
  const stats = calculateStats()
  let yPos = 50
  
  // Métricas clave en formato ejecutivo
  doc.setFontSize(14)
  doc.text('MÉTRICAS CLAVE', 20, yPos)
  yPos += 20
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  
  // Crear cajas con métricas
  doc.setDrawColor(0, 100, 200)
  doc.rect(20, yPos, 40, 25)
  doc.text('TOTAL', 25, yPos + 10)
  doc.setFontSize(16)
  doc.text(stats.total.toString(), 30, yPos + 20)
  
  doc.setFontSize(12)
  doc.rect(70, yPos, 40, 25)
  doc.text('ACTIVAS', 75, yPos + 10)
  doc.setFontSize(16)
  doc.text(stats.activas.toString(), 80, yPos + 20)
  
  doc.setFontSize(12)
  doc.rect(120, yPos, 50, 25)
  doc.text('DISPONIBILIDAD', 125, yPos + 10)
  doc.setFontSize(16)
  doc.text(`${Math.round(stats.activas / stats.total * 100)}%`, 135, yPos + 20)
  
  yPos += 40
  
  // Tabla resumida solo con campos clave
  generateSummaryTable(doc, yPos)
}

// Plantilla control de inventario
const generateInventoryPDF = doc => {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('CONTROL DE INVENTARIO - ARMAS', 20, 30)
  
  let yPos = 50
  
  // Agrupar por estado
  const armasPorEstado = filteredArmas.value.reduce((acc, arma) => {
    if (!acc[arma.estado]) acc[arma.estado] = []
    acc[arma.estado].push(arma)
    
    return acc
  }, {})
  
  Object.entries(armasPorEstado).forEach(([estado, armas]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`${estado.toUpperCase()} (${armas.length})`, 20, yPos)
    yPos += 15
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    
    armas.forEach(arma => {
      if (yPos > 270) {
        doc.addPage()
        yPos = 30
      }
      
      doc.text(`• ${arma.nombre} - ${arma.tipo} (${arma.fabricante})`, 25, yPos)
      yPos += 8
    })
    
    yPos += 10
  })
}

// Funciones auxiliares
const calculateStats = () => {
  const total = filteredArmas.value.length
  const activas = filteredArmas.value.filter(a => a.estado === 'Activo').length
  const mantenimiento = filteredArmas.value.filter(a => a.estado === 'Mantenimiento').length
  
  // Validar que hay armas para evitar errores
  if (total === 0) {
    return {
      total: 0,
      activas: 0,
      mantenimiento: 0,
      fabricanteMasComun: 'N/A',
      tipoMasComun: 'N/A',
    }
  }
  
  // Fabricante más común
  const fabricantes = filteredArmas.value.reduce((acc, arma) => {
    const fabricante = arma.fabricante || 'No especificado'

    acc[fabricante] = (acc[fabricante] || 0) + 1
    
    return acc
  }, {})
  
  const fabricanteMasComun = Object.keys(fabricantes).length > 0 
    ? Object.keys(fabricantes).reduce((a, b) => fabricantes[a] > fabricantes[b] ? a : b)
    : 'N/A'
  
  // Tipo más común
  const tipos = filteredArmas.value.reduce((acc, arma) => {
    const tipo = arma.tipo || 'No especificado'

    acc[tipo] = (acc[tipo] || 0) + 1
    
    return acc
  }, {})
  
  const tipoMasComun = Object.keys(tipos).length > 0 
    ? Object.keys(tipos).reduce((a, b) => tipos[a] > tipos[b] ? a : b)
    : 'N/A'
  
  return { total, activas, mantenimiento, fabricanteMasComun, tipoMasComun }
}

const generateStandardTable = (doc, startY) => {
  // Reutilizar la lógica de tabla de la plantilla estándar
  let yPosition = startY
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  
  doc.text('ID', 20, yPosition)
  doc.text('NOMBRE', 35, yPosition)
  doc.text('TIPO', 70, yPosition)
  doc.text('CALIBRE', 105, yPosition)
  doc.text('FABRICANTE', 130, yPosition)
  doc.text('ESTADO', 165, yPosition)
  
  doc.line(20, yPosition + 2, 190, yPosition + 2)
  yPosition += 8
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  
  filteredArmas.value.forEach(arma => {
    if (yPosition > 270) {
      doc.addPage()
      yPosition = 30
    }
    
    doc.text(arma.id.toString(), 20, yPosition)
    doc.text(arma.nombre, 35, yPosition)
    doc.text(arma.tipo, 70, yPosition)
    doc.text(arma.calibre, 105, yPosition)
    doc.text(arma.fabricante, 130, yPosition)
    doc.text(arma.estado, 165, yPosition)
    
    yPosition += 8
  })
}

const generateSummaryTable = (doc, startY) => {
  let yPosition = startY
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('RESUMEN POR TIPO', 20, yPosition)
  yPosition += 15
  
  // Validar que hay armas
  if (filteredArmas.value.length === 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('No hay armas para mostrar', 25, yPosition)
    
    return
  }
  
  // Agrupar por tipo
  const armasPorTipo = filteredArmas.value.reduce((acc, arma) => {
    if (!acc[arma.tipo]) acc[arma.tipo] = 0
    acc[arma.tipo]++
    
    return acc
  }, {})
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  
  Object.entries(armasPorTipo).forEach(([tipo, cantidad]) => {
    doc.text(`${tipo}: ${cantidad} unidades`, 25, yPosition)
    yPosition += 10
  })
}

// Función para generar PDF simple (para empezar)
const generateSimplePDF = async () => {
  try {
    console.log('🔄 Generando PDF simple de prueba...')
    loading.value = true
    pdfError.value = null
    
    // Crear un PDF simple con jsPDF en lugar de usar URL externa
    const doc = new jsPDF()
    
    // Configurar el documento
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('@tato30/vue-pdf - PDF de Prueba', 20, 30)
    
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.text('Este es un PDF de prueba generado con jsPDF', 20, 50)
    doc.text('para probar el visor @tato30/vue-pdf', 20, 65)
    
    doc.setFontSize(10)
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 90)
    doc.text(`Hora: ${new Date().toLocaleTimeString('es-ES')}`, 20, 105)
    
    // Agregar algunos elementos gráficos
    doc.setDrawColor(0, 100, 200)
    doc.rect(20, 120, 170, 40)
    
    doc.setFontSize(12)
    doc.text('✅ PDF generado correctamente', 25, 140)
    doc.text('✅ Visor funcionando', 25, 155)
    
    // Generar el blob
    const pdfOutput = doc.output('blob')

    pdfBlob.value = pdfOutput
    
    // Crear URL para el visor
    const pdfUrl = URL.createObjectURL(pdfOutput)

    pdfSrc.value = pdfUrl
    
    console.log('✅ PDF de prueba generado:', pdfUrl)
    
    // Resetear configuración y zoom inicial
    currentPage.value = 1
    pdfPages.value = 0
    pdfZoom.value = 2.0 // Zoom inicial al 200%
    useIframe.value = false // Usar VuePDF por defecto
    
    showPdfViewer.value = true
    loading.value = false
    
  } catch (error) {
    console.error('❌ Error al generar PDF simple:', error)
    pdfError.value = error.message
    loading.value = false
    alert(`Error al generar PDF de prueba: ${error.message}`)
  }
}

// === Funciones de exportación ===

const exportToExcel = () => {
  try {
    console.log('📊 Exportando a Excel...')
    
    // Preparar datos para Excel
    const excelData = filteredArmas.value.map(arma => ({
      ID: arma.id,
      Nombre: arma.nombre,
      Tipo: arma.tipo,
      Calibre: arma.calibre,
      Fabricante: arma.fabricante,
      Peso: arma.peso,
      Longitud: arma.longitud,
      Estado: arma.estado,
      'Fecha de Registro': arma.fechaRegistro,
    }))
    
    // Crear libro de trabajo
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    
    // Agregar hoja
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario de Armas')
    
    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 5 },  // ID
      { wch: 20 }, // Nombre
      { wch: 18 }, // Tipo
      { wch: 12 }, // Calibre
      { wch: 15 }, // Fabricante
      { wch: 10 }, // Peso
      { wch: 10 }, // Longitud
      { wch: 12 }, // Estado
      { wch: 15 }, // Fecha
    ]

    ws['!cols'] = colWidths
    
    // Generar archivo y descargarlo
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    const fileName = `inventario-armas-${new Date().toISOString().split('T')[0]}.xlsx`

    saveAs(blob, fileName)
    
    console.log('✅ Excel exportado exitosamente:', fileName)
  } catch (error) {
    console.error('❌ Error al exportar Excel:', error)
    alert(`Error al exportar Excel: ${error.message}`)
  }
}

const exportToCSV = () => {
  try {
    console.log('📄 Exportando a CSV...')
    
    // Preparar encabezados
    const headers = ['ID', 'Nombre', 'Tipo', 'Calibre', 'Fabricante', 'Peso', 'Longitud', 'Estado', 'Fecha de Registro']
    
    // Preparar datos
    const csvData = filteredArmas.value.map(arma => [
      arma.id,
      arma.nombre,
      arma.tipo,
      arma.calibre,
      arma.fabricante,
      arma.peso,
      arma.longitud,
      arma.estado,
      arma.fechaRegistro,
    ])
    
    // Combinar encabezados y datos
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    // Crear blob y descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const fileName = `inventario-armas-${new Date().toISOString().split('T')[0]}.csv`

    saveAs(blob, fileName)
    
    console.log('✅ CSV exportado exitosamente:', fileName)
  } catch (error) {
    console.error('❌ Error al exportar CSV:', error)
    alert(`Error al exportar CSV: ${error.message}`)
  }
}

const exportToJSON = () => {
  try {
    console.log('📋 Exportando a JSON...')
    
    const jsonData = {
      metadata: {
        fechaExportacion: new Date().toISOString(),
        totalRegistros: filteredArmas.value.length,
        filtrosAplicados: {
          busqueda: search.value,
          tipo: selectedTipo.value,
          estado: selectedEstado.value,
          fabricante: selectedFabricante.value,
          fechaDesde: dateFrom.value,
          fechaHasta: dateTo.value,
        },
      },
      armas: filteredArmas.value,
    }
    
    const jsonString = JSON.stringify(jsonData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const fileName = `inventario-armas-${new Date().toISOString().split('T')[0]}.json`

    saveAs(blob, fileName)
    
    console.log('✅ JSON exportado exitosamente:', fileName)
  } catch (error) {
    console.error('❌ Error al exportar JSON:', error)
    alert(`Error al exportar JSON: ${error.message}`)
  }
}

// Función general de exportación
const handleExport = () => {
  switch (exportFormat.value) {
  case 'excel':
    exportToExcel()
    break
  case 'csv':
    exportToCSV()
    break
  case 'json':
    exportToJSON()
    break
  case 'pdf':
    generateCustomPDF()
    break
  default:
    console.warn('Formato de exportación no soportado:', exportFormat.value)
  }
  
  showExportDialog.value = false
}

// === Funciones para limpiar filtros ===

const clearAllFilters = () => {
  search.value = ''
  selectedTipo.value = ''
  selectedEstado.value = ''
  selectedFabricante.value = ''
  dateFrom.value = ''
  dateTo.value = ''
  console.log('🧹 Filtros limpiados')
}

const downloadPDF = () => {
  if (pdfBlob.value) {
    const url = URL.createObjectURL(pdfBlob.value)
    const a = document.createElement('a')

    a.href = url
    a.download = `reporte-armas-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

// Función de prueba simple
const testPdfGeneration = async () => {
  try {
    console.log('🧪 Iniciando prueba de generación PDF...')
    
    const doc = new jsPDF()

    doc.text('Prueba Simple', 20, 20)
    doc.text('Este es un PDF de prueba básico', 20, 30)
    
    const blob = doc.output('blob')

    console.log('📄 Blob generado:', blob)
    
    const url = URL.createObjectURL(blob)

    console.log('🔗 URL generada:', url)
    
    // Abrir en nueva pestaña para ver si el PDF se genera correctamente
    window.open(url, '_blank')
    
    return url
  } catch (error) {
    console.error('❌ Error en prueba:', error)
    throw error
  }
}

// Función para probar con PDF externo compatible
const testExternalPDF = () => {
  console.log('🌐 Probando PDF externo compatible...')
  loading.value = true
  pdfError.value = null
  
  // Usar un PDF que sí permita iframe (ejemplo: Mozilla PDF.js)
  pdfSrc.value = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
  
  currentPage.value = 1
  pdfPages.value = 0
  useIframe.value = false
  
  showPdfViewer.value = true
  loading.value = false
}

// Función para abrir PDF en nueva pestaña
const openPdfInNewTab = () => {
  if (pdfSrc.value) {
    console.log('🔗 Abriendo PDF en nueva pestaña:', pdfSrc.value)
    window.open(pdfSrc.value, '_blank')
  } else {
    console.warn('⚠️ No hay PDF para abrir')
  }
}

// Función para reintentar la carga del PDF
const retryPdfLoad = () => {
  console.log('🔄 Reintentando carga del PDF...')
  pdfError.value = null
  loading.value = true
  
  // Esperar un momento y limpiar el estado
  setTimeout(() => {
    if (pdfSrc.value) {
      // Forzar recarga del componente
      const currentSrc = pdfSrc.value

      pdfSrc.value = ''
      
      setTimeout(() => {
        pdfSrc.value = currentSrc
        loading.value = false
      }, 100)
    }
  }, 200)
}

// Funciones CRUD
const viewArma = arma => {
  console.log('Ver arma:', arma)
}

const editArma = arma => {
  console.log('Editar arma:', arma)
}

const deleteArma = arma => {
  console.log('Eliminar arma:', arma)
}

const onPdfError = error => {
  console.error('❌ Error en el visor PDF:', error)
  console.error('📄 PDF Source:', pdfSrc.value)
  loading.value = false
  
  // Determinar el tipo de error y sugerir solución
  let errorMessage = 'Error desconocido'
  let suggestion = 'Prueba cambiando a modo Iframe'
  
  if (error?.message?.includes('CSP') || error?.message?.includes('frame-ancestors')) {
    errorMessage = 'Error de Content Security Policy (CSP)'
    suggestion = 'Este PDF no puede mostrarse en iframe. Usa "Nueva pestaña"'
  } else if (error?.message?.includes('Failed to fetch')) {
    errorMessage = 'Error de red al cargar PDF'
    suggestion = 'Verifica tu conexión o usa "Nueva pestaña"'
  } else if (error?.message?.includes('Invalid PDF')) {
    errorMessage = 'PDF inválido o corrupto'
    suggestion = 'Regenera el PDF'
  } else {
    errorMessage = error?.message || 'Error al cargar PDF'
  }
  
  pdfError.value = `${errorMessage} - ${suggestion}`
  
  console.warn('💡 Sugerencia:', suggestion)
}

// Inicialización
onMounted(() => {
  armas.value = armasData
  console.log('Componente montado - vue-pdf-embed con funcionalidades avanzadas está listo')
})
</script>

<template>
  <VContainer
    fluid
    class="pa-6"
  >
    <!-- Header -->
    <VRow>
      <VCol cols="12">
        <VCard>
          <VCardTitle class="d-flex align-center justify-space-between">
            <span class="text-h5">🔫 Gestión de Armas Paramétrica</span>
            <VChip
              color="success"
              variant="elevated"
            >
              vue-pdf-embed v2.1.3
            </VChip>
          </VCardTitle>
        </VCard>
      </VCol>
    </VRow>

    <!-- Controles principales -->
    <VRow class="mt-4">
      <VCol
        cols="12"
        md="4"
      >
        <VTextField
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar armas..."
          variant="outlined"
          density="compact"
          clearable
        />
      </VCol>
      <VCol
        cols="12"
        md="4"
        class="d-flex align-center gap-2"
      >
        <VBtn
          :color="showAdvancedFilters ? 'primary' : 'secondary'"
          prepend-icon="mdi-filter-variant"
          variant="outlined"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          Filtros {{ showAdvancedFilters ? 'Ocultar' : 'Avanzados' }}
        </VBtn>
        <VBtn
          color="warning"
          prepend-icon="mdi-filter-remove"
          variant="outlined"
          @click="clearAllFilters"
        >
          Limpiar
        </VBtn>
      </VCol>
      <VCol
        cols="12"
        md="4"
        class="d-flex justify-end align-center gap-2"
      >
        <VBtn
          color="success"
          prepend-icon="mdi-file-pdf-box"
          :loading="loading"
          @click="showTemplateDialog = true"
        >
          📄 PDF
        </VBtn>
        <VBtn
          color="info"
          prepend-icon="mdi-export"
          @click="showExportDialog = true"
        >
          📊 Exportar
        </VBtn>
      </VCol>
    </VRow>

    <!-- Filtros avanzados -->
    <VRow
      v-if="showAdvancedFilters"
      class="mt-2"
    >
      <VCol cols="12">
        <VCard variant="outlined">
          <VCardTitle class="text-h6">
            🔍 Filtros Avanzados
          </VCardTitle>
          <VCardText>
            <VRow>
              <VCol
                cols="12"
                md="3"
              >
                <VSelect
                  v-model="selectedTipo"
                  :items="tiposArmas"
                  label="Tipo de arma"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </VCol>
              <VCol
                cols="12"
                md="3"
              >
                <VSelect
                  v-model="selectedEstado"
                  :items="estadosArmas"
                  label="Estado"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </VCol>
              <VCol
                cols="12"
                md="3"
              >
                <VSelect
                  v-model="selectedFabricante"
                  :items="fabricantesArmas"
                  label="Fabricante"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </VCol>
              <VCol
                cols="12"
                md="3"
              >
                <VTextField
                  v-model="dateFrom"
                  label="Fecha desde"
                  type="date"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </VCol>
            </VRow>
            <VRow>
              <VCol
                cols="12"
                md="3"
              >
                <VTextField
                  v-model="dateTo"
                  label="Fecha hasta"
                  type="date"
                  variant="outlined"
                  density="compact"
                  clearable
                />
              </VCol>
              <VCol
                cols="12"
                md="9"
                class="d-flex align-center justify-end"
              >
                <VChip
                  v-if="filteredArmas.length !== armasData.length"
                  color="primary"
                  variant="elevated"
                >
                  {{ filteredArmas.length }} de {{ armasData.length }} armas
                </VChip>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Tabla de armas -->
    <VRow class="mt-4">
      <VCol cols="12">
        <VCard>
          <VCardTitle>
            <span class="text-h6">Listado de Armas ({{ filteredArmas.length }})</span>
          </VCardTitle>
          <VDataTable
            v-model="selectedArmas"
            :headers="headers"
            :items="filteredArmas"
            :search="search"
            item-value="id"
            show-select
            class="elevation-1"
          >
            <!-- Slot para el estado -->
            <template #item.estado="{ item }">
              <VChip
                :color="item.estado === 'Activo' ? 'success' : 'warning'"
                variant="elevated"
                size="small"
              >
                {{ item.estado }}
              </VChip>
            </template>

            <!-- Slot para acciones -->
            <template #item.actions="{ item }">
              <VBtn
                icon="mdi-eye"
                variant="text"
                size="small"
                color="primary"
                @click="viewArma(item)"
              />
              <VBtn
                icon="mdi-pencil"
                variant="text"
                size="small"
                color="warning"
                @click="editArma(item)"
              />
              <VBtn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click="deleteArma(item)"
              />
            </template>
          </VDataTable>
        </VCard>
      </VCol>
    </VRow>

    <!-- Visor de PDF -->
    <VDialog
      v-model="showPdfViewer"
      max-width="90vw"
      max-height="90vh"
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>📄 Visor PDF - vue-pdf-embed</span>
          <div class="d-flex align-center gap-2">
            <!-- Controles de zoom -->
            <VBtnGroup 
              variant="outlined" 
              color="primary"
            >
              <VBtn
                size="small"
                color="primary"
                :disabled="pdfZoom <= 0.5"
                @click="zoomOut"
              >
                <VIcon 
                  icon="mdi-magnify-minus" 
                  size="large"
                />
                <span style=" font-size: 14px; font-weight: bold;margin-inline-start: 6px;">-</span>
              </VBtn>
              <VBtn
                size="small"
                min-width="70"
                color="primary"
                variant="outlined"
                @click="resetZoom"
              >
                <span style="color: #1976d2; font-size: 14px; font-weight: bold;">
                  {{ Math.round(pdfZoom * 100) }}%
                </span>
              </VBtn>
              <VBtn
                size="small"
                color="primary"
                :disabled="pdfZoom >= 3.0"
                @click="zoomIn"
              >
                <VIcon 
                  icon="mdi-magnify-plus" 
                  size="large"
                />
                <span style=" font-size: 14px; font-weight: bold;margin-inline-start: 6px;">+</span>
              </VBtn>
            </VBtnGroup>
            
            <!-- Controles de rotación -->
            <VBtnGroup 
              variant="outlined"
              color="secondary"
            >
              <VBtn
                size="small"
                color="secondary"
                @click="rotateCounterClockwise"
              >
                <VIcon 
                  icon="mdi-rotate-left" 
                  size="large"
                />
                <span style=" font-size: 16px; font-weight: bold;margin-inline-start: 6px;">↺</span>
              </VBtn>
              <VBtn
                size="small"
                color="secondary"
                @click="rotateClockwise"
              >
                <VIcon 
                  icon="mdi-rotate-right" 
                  size="large"
                />
                <span style=" font-size: 16px; font-weight: bold;margin-inline-start: 6px;">↻</span>
              </VBtn>
            </VBtnGroup>
            
            <!-- Controles existentes -->
            <VBtn
              v-if="pdfBlob"
              color="success"
              variant="elevated"
              size="default"
              @click="downloadPDF"
            >
              <template #prepend>
                <VIcon 
                  icon="tabler-download" 
                  :size="16" 
                  class="me-1"
                />
              </template>
              <span style=" font-size: 14px;font-weight: bold;">Descargar</span>
            </VBtn>
            <VBtn
              v-if="pdfSrc"
              color="info"
              variant="elevated"
              size="default"
              @click="openPdfInNewTab"
            >
              <template #prepend>
                <VIcon 
                  icon="mdi-open-in-new" 
                  :size="16" 
                  class="me-1"
                />
              </template>
              <span style=" font-size: 14px;font-weight: bold;">Nueva pestaña</span>
            </VBtn>
            <VBtn
              v-if="pdfSrc"
              :color="useIframe ? 'warning' : 'secondary'"
              variant="elevated"
              size="default"
              @click="useIframe = !useIframe"
            >
              <template #prepend>
                <VIcon 
                  icon="mdi-swap-horizontal" 
                  size="16" 
                  class="me-1"
                />
              </template>
              <span style=" font-size: 14px;font-weight: bold;">
                {{ useIframe ? 'VuePdfEmbed' : 'Iframe' }}
              </span>
            </VBtn>
            <VBtn
              variant="elevated"
              color="grey-darken-1"
              size="default"
              @click="showPdfViewer = false"
            >
              <VIcon 
                icon="tabler-info-circle" 
                size="16" 
                class="me-1"
              />
              <span style=" font-size: 14px;font-weight: bold;">Cerrar</span>
            </VBtn>
          </div>
        </VCardTitle>
        <VCardText style="block-size: 70vh;">
          <!-- Debug info -->
          <div 
            v-if="pdfSrc" 
            class="mb-2 pa-2 bg-grey-lighten-4 rounded text-caption"
          >
            <div>🔗 PDF URL: {{ pdfSrc.substring(0, 50) }}...</div>
            <div>📄 Páginas: {{ pdfPages || 'Detectando...' }}</div>
            <div>📊 Blob size: {{ pdfBlob ? Math.round(pdfBlob.size / 1024) + ' KB' : 'N/A' }}</div>
          </div>
          
          <!-- Error message -->
          <VAlert
            v-if="pdfError"
            type="error"
            class="mb-4"
            closable
            @click:close="pdfError = null"
          >
            <strong>Error del PDF:</strong> {{ pdfError }}
          </VAlert>
          
          <!-- Visor PDF Principal -->
          <div
            v-if="pdfSrc && !pdfError"
            style=" display: flex;overflow: auto; align-items: flex-start; justify-content: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f5f5f5; block-size: calc(100% - 80px); inline-size: 100%;"
          >
            <!-- Opción 1: VuePdfEmbed (por defecto) -->
            <div 
              v-if="!useIframe"
              style="display: flex; justify-content: center; inline-size: 100%;"
            >
              <VuePdfEmbed 
                :source="pdfSrc"
                :page="currentPage"
                :width="Math.round(600 * pdfZoom)"
                :rotation="pdfRotation"
                style=" border-radius: 8px; background: white;box-shadow: 0 4px 12px rgba(0, 0, 0, 15%);"
                @loading="() => { 
                  loading = true; 
                  console.log('🔄 VuePdfEmbed cargando...'); 
                }"
                @loaded="onPdfLoaded"
                @rendered="() => { 
                  console.log('✅ VuePdfEmbed página renderizada'); 
                }"
                @loading-failed="(error) => {
                  console.error('❌ Error en VuePdfEmbed:', error);
                  pdfError = 'Error en VuePdfEmbed - Prueba cambiando a Iframe';
                  loading = false;
                }"
              />
            </div>
            
            <!-- Opción 2: Iframe (respaldo) -->
            <div
              v-else
              style="display: flex; flex-direction: column; align-items: center; block-size: 100%; inline-size: 100%;"
            >
              <div class="text-center mb-2 text-caption">
                Modo Iframe - Algunas funciones pueden estar limitadas
              </div>
              <iframe
                :src="pdfSrc"
                :style="`border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); background: white; inline-size: ${Math.round(600 * pdfZoom)}px; block-size: ${Math.round(800 * pdfZoom)}px; max-inline-size: 100%; max-block-size: calc(100% - 30px);`"
                title="PDF Viewer - Iframe Mode"
                @load="() => {
                  loading = false;
                  pdfError = null;
                  console.log('✅ Iframe cargado exitosamente');
                }"
                @error="(e) => {
                  console.error('❌ Error en iframe:', e);
                  pdfError = 'Error de CSP o URL bloqueada - Usa Nueva Pestaña';
                  loading = false;
                }"
              />
            </div>
          </div>
          
          <!-- Fallback: Iframe si VuePDF falla -->
          <div
            v-else-if="pdfSrc && pdfError"
            style="block-size: calc(100% - 80px); inline-size: 100%;"
          >
            <div class="text-center mb-2">
              <VBtn
                color="info"
                prepend-icon="mdi-refresh"
                @click="retryPdfLoad"
              >
                Reintentar con iframe
              </VBtn>
            </div>
            <iframe
              :src="pdfSrc"
              style=" border: 1px solid #ddd; border-radius: 8px; block-size: 100%;inline-size: 100%;"
              title="PDF Viewer"
            />
          </div>
          
          <!-- Loading state -->
          <div
            v-else
            class="d-flex align-center justify-center"
            style="block-size: 100%;"
          >
            <VProgressCircular
              indeterminate
              color="primary"
              size="50"
            />
            <span style="margin-inline-start: 16px;">Generando PDF...</span>
          </div>
          
          <!-- Controles de navegación si hay múltiples páginas -->
          <div 
            v-if="pdfPages > 1" 
            class="d-flex align-center justify-center mt-2 gap-2"
          >
            <VBtn
              size="default"
              color="primary"
              variant="elevated"
              :disabled="currentPage <= 1"
              @click="currentPage--"
            >
              <VIcon 
                icon="mdi-chevron-left" 
                size="large"
              />
            </VBtn>
            <VChip 
              variant="elevated"
              color="primary"
              size="large"
            >
              <span style="font-size: 16px; font-weight: bold;">
                {{ currentPage }} / {{ pdfPages }}
              </span>
            </VChip>
            <VBtn
              size="default"
              color="primary"
              variant="elevated"
              :disabled="currentPage >= pdfPages"
              @click="currentPage++"
            >
              <VIcon 
                icon="mdi-chevron-right" 
                size="large"
              />
            </VBtn>
          </div>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Diálogo de selección de plantilla PDF -->
    <VDialog
      v-model="showTemplateDialog"
      max-width="600"
    >
      <VCard>
        <VCardTitle>
          📄 Seleccionar Plantilla de PDF
        </VCardTitle>
        <VCardText>
          <VRadioGroup v-model="selectedTemplate">
            <VRadio
              v-for="template in templates"
              :key="template.value"
              :value="template.value"
            >
              <template #label>
                <div>
                  <div class="text-h6">
                    {{ template.title }}
                  </div>
                  <div class="text-body-2 text-medium-emphasis">
                    {{ template.description }}
                  </div>
                </div>
              </template>
            </VRadio>
          </VRadioGroup>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showTemplateDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            :loading="loading"
            @click="generateCustomPDF(); showTemplateDialog = false"
          >
            Generar PDF
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Diálogo de exportación -->
    <VDialog
      v-model="showExportDialog"
      max-width="500"
    >
      <VCard>
        <VCardTitle>
          📊 Exportar Datos
        </VCardTitle>
        <VCardText>
          <div class="mb-4">
            <div class="text-body-1 mb-2">
              Se exportarán <strong>{{ filteredArmas.length }}</strong> registros
            </div>
            <VChip
              v-if="filteredArmas.length !== armasData.length"
              color="info"
              variant="elevated"
              size="small"
            >
              Filtros aplicados
            </VChip>
          </div>
          
          <VRadioGroup v-model="exportFormat">
            <VRadio value="pdf">
              <template #label>
                <div class="d-flex align-center">
                  <VIcon
                    icon="mdi-file-pdf-box"
                    color="red"
                    class="me-2"
                  />
                  <div>
                    <div class="text-subtitle-1">
                      PDF
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Documento con formato y marca de agua
                    </div>
                  </div>
                </div>
              </template>
            </VRadio>
            
            <VRadio value="excel">
              <template #label>
                <div class="d-flex align-center">
                  <VIcon
                    icon="mdi-microsoft-excel"
                    color="green"
                    class="me-2"
                  />
                  <div>
                    <div class="text-subtitle-1">
                      Excel (.xlsx)
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Hoja de cálculo para análisis
                    </div>
                  </div>
                </div>
              </template>
            </VRadio>
            
            <VRadio value="csv">
              <template #label>
                <div class="d-flex align-center">
                  <VIcon
                    icon="mdi-file-delimited"
                    color="blue"
                    class="me-2"
                  />
                  <div>
                    <div class="text-subtitle-1">
                      CSV
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Archivo de texto separado por comas
                    </div>
                  </div>
                </div>
              </template>
            </VRadio>
            
            <VRadio value="json">
              <template #label>
                <div class="d-flex align-center">
                  <VIcon
                    icon="mdi-code-json"
                    color="orange"
                    class="me-2"
                  />
                  <div>
                    <div class="text-subtitle-1">
                      JSON
                    </div>
                    <div class="text-body-2 text-medium-emphasis">
                      Formato para desarrollo e integración
                    </div>
                  </div>
                </div>
              </template>
            </VRadio>
          </VRadioGroup>
        </VCardText>
        <VCardActions>
          <VSpacer />
          <VBtn
            variant="text"
            @click="showExportDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            prepend-icon="mdi-export"
            @click="handleExport"
          >
            Exportar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VContainer>
</template>

<style scoped>
.v-data-table {
  border-radius: 8px;
}

.v-card {
  border-radius: 12px;
}

.pdf-viewer {
  overflow: hidden;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
</style>
