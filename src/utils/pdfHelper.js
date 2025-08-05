// NUEVA FUNCIÓN PDF - IMPLEMENTACIÓN LIMPIA
export const createPdfReport = async (armasData = []) => {
  try {
    console.log('🚀 Creando PDF con @tato30/vue-pdf...')
    console.log('📊 Datos recibidos:', armasData.length, 'armas')
    
    // Crear PDF simple
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    
    // Título principal
    doc.setFontSize(20)
    doc.text('REPORTE DE ARMAS', 20, 30)
    
    // Información del reporte
    doc.setFontSize(12)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 50)
    doc.text(`Total de armas: ${armasData.length}`, 20, 65)
    doc.text('Generado con @tato30/vue-pdf', 20, 80)
    
    // Agregar datos de armas si existen
    if (armasData.length > 0) {
      let yPosition = 100
      doc.setFontSize(14)
      doc.text('INVENTARIO:', 20, yPosition)
      
      doc.setFontSize(10)
      armasData.forEach((arma, index) => {
        yPosition += 15
        if (yPosition > 270) { // Nueva página si es necesario
          doc.addPage()
          yPosition = 30
        }
        
        const armaText = `${index + 1}. ${arma.nombre} - ${arma.tipo} (${arma.calibre})`

        doc.text(armaText, 25, yPosition)
      })
    }
    
    // Convertir a blob
    const pdfBlob = doc.output('blob')
    const pdfUrl = URL.createObjectURL(pdfBlob)
    
    console.log('✅ PDF creado exitosamente:', pdfBlob.size, 'bytes')
    
    return { pdfUrl, pdfBlob }
    
  } catch (error) {
    console.error('❌ Error creando PDF:', error)
    throw error
  }
}
