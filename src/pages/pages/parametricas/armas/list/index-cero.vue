<script setup>
import DialogCloseBtn from '@/@core/components/DialogCloseBtn.vue'
import { useApi } from '@/composables/useApi'
import ArmaInfoEditDialog from '@/pages/components/dialogs/ArmaInfoEditDialog.vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

// Composable para traducción
const { t } = useI18n()

// Composable para detectar breakpoints
const { smAndDown } = useDisplay()

// Variable de entorno para evitar problemas de parsing
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

// Filtros y selección
const searchQuery = ref('') // Para el campo de búsqueda
const selectedStatus = ref(null) // Para el filtro de estado
const selectedRows = ref([]) // Para filas seleccionadas en la tabla
const selectAll = ref(false) // Para el checkbox "Seleccionar Todos"
const isDeleting = ref(false) // Estado de carga para eliminación múltiple

// Control de modales para mensajes
const showSuccessModal = ref(false)
const showErrorModal = ref(false)
const showDeletedModal = ref(false)
const successMessage = ref('')
const successTitle = ref('')
const errorMessage = ref('')
const errorTitle = ref('')

// Control de modales y formularios
const isDialogVisible = ref(false) // Controla la visibilidad del modal de edición/creación
const formMode = ref('create') // Modo del formulario: 'create' o 'edit'
const selectedArma = ref({}) // Arma seleccionada para editar
const formErrors = ref({}) // Errores del formulario
const isDialogVisibleDelete = ref(false)
const armaIdToDelete = ref(null) // Controla la visibilidad del modal de confirmación de eliminación

// Control para modal de confirmación de cancelación
const showCancelConfirmation = ref(false)

// Control para modal de eliminación múltiple
const isDialogVisibleDeleteMultiple = ref(false)

// Control para eliminación con opción de deshacer
const deletedArma = ref(null) // Guarda los datos del arma eliminada
const isRestoring = ref(false) // Estado de carga para restaurar

// Control para mostrar registros eliminados
const isDeletedListVisible = ref(false) // Controla la visibilidad del modal de eliminados
const deletedArmas = ref([]) // Lista de armas eliminadas
const isFetchingDeleted = ref(false) // Estado de carga para registros eliminados
const isRestoringFromList = ref(false) // Estado de carga para restaurar desde lista

// Control para destacar registro recién creado
const recentlyCreatedId = ref(null) // ID del registro recién creado para mostrarlo al principio temporalmente

// Abre el modal de edición y carga los datos del arma seleccionada
const openEditModal = arma => {
  // Mapear los datos de snake_case a camelCase para el formulario
  selectedArma.value = {
    id: arma.id,
    armaCod: arma.arma_cod,
    armaDescripcion: arma.arma_descripcion,
    armaAbreviacion: arma.arma_abreviacion,
    armaPosicion: arma.arma_posicion,
    armaEstado: arma.arma_estado,
  }
  formMode.value = 'edit'
  isDialogVisible.value = true
}

// Abre el modal de creación con datos limpios
const openCreateModal = () => {
  selectedArma.value = {} // Reinicia los datos
  formMode.value = 'create'
  formErrors.value = {} // Limpia errores del formulario anterior
  isDialogVisible.value = true
}

// Función para manejar el cierre del modal
const handleDialogClose = () => {
  isDialogVisible.value = false
  formErrors.value = {} // Limpia errores cuando se cierra el modal
}

// Funciones para mostrar mensajes en modales
const showSuccessMessage = (title, message) => {
  successTitle.value = title
  successMessage.value = message
  showSuccessModal.value = true
  
  // Auto-cerrar después de 3 segundos
  setTimeout(() => {
    showSuccessModal.value = false
  }, 3000)
}

const showErrorMessage = (title, message) => {
  errorTitle.value = title
  errorMessage.value = message
  showErrorModal.value = true
}

const closeSuccessModal = () => {
  showSuccessModal.value = false
}

const closeErrorModal = () => {
  showErrorModal.value = false
}

const showDeletedMessage = armaData => {
  deletedArma.value = { ...armaData }
  showDeletedModal.value = true
  
  // Auto-cerrar después de 30 segundos (más tiempo para que el usuario pueda restaurar)
  setTimeout(() => {
    if (showDeletedModal.value) {
      showDeletedModal.value = false
      deletedArma.value = null
    }
  }, 30000)
}

const closeDeletedModal = () => {
  showDeletedModal.value = false
  deletedArma.value = null
}

// Maneja el submit del formulario de arma (crear o editar)
const handleArmaSubmit = async ({ data, mode }) => {
  formErrors.value = {} // Limpia errores previos

  console.log('📝 handleArmaSubmit - Data recibida:', data)
  console.log('📝 handleArmaSubmit - Mode:', mode)

  try {
    // Prepara el payload, mapeando las propiedades camelCase a snake_case para la API
    const payload = {
      'arma_cod': data.armaCod || data.arma_cod,
      'arma_descripcion': data.armaDescripcion || data.arma_descripcion,
      'arma_abreviacion': data.armaAbreviacion || data.arma_abreviacion,
      'arma_posicion': Number(data.armaPosicion || data.arma_posicion),
      'arma_estado': data.armaEstado || data.arma_estado || 'Activo',
    }

    // Agregar ID para edición
    if (mode === 'edit' && data.id) {
      payload.id = data.id
    }

    console.log('📝 handleArmaSubmit - Data original:', data)
    console.log('📝 handleArmaSubmit - Payload preparado:', payload)

    let responseData = null

    if (mode === 'create') {
      // Crea nueva arma
      console.log('📝 Enviando petición POST a /armas')
      
      const response = await useApi('/armas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      console.log('📝 Respuesta de creación:', { responseData: response.data, error: response.error, statusCode: response.statusCode })
      
      if (response.error.value) {
        throw response.error.value
      }
      
      responseData = response.data
      showSuccessMessage('✅ Operación Exitosa', 'Arma creada correctamente')
    } else if (mode === 'edit') {
      // Edita arma existente
      console.log(`📝 Enviando petición PUT a /armas/${data.id}`)
      
      const response = await useApi(`/armas/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      console.log('📝 Respuesta de edición:', { responseData: response.data, error: response.error, statusCode: response.statusCode })
      console.log('📝 Payload enviado:', payload)
      
      if (response.error.value) {
        throw response.error.value
      }
      
      responseData = response.data
      showSuccessMessage('✅ Operación Exitosa', 'Arma actualizada correctamente')
    }

    // Muestra mensaje de éxito y recarga la tabla
    // (El mensaje ya se mostró arriba con showSuccessMessage)
    
    // Cerrar el modal
    isDialogVisible.value = false
    
    // Actualizar solo este registro en la tabla sin recargar
    if (mode === 'create') {
      // Para crear, agregar el nuevo registro si viene en la respuesta
      if (responseData.value?.data) {
        const newArma = responseData.value.data
        
        updateArmaInTable(newArma, true) // Indicar que es un registro nuevo
        
        // Marcar como recién creado para mostrarlo al principio temporalmente
        recentlyCreatedId.value = newArma.id
        
        // Ir a la primera página para mostrar el nuevo registro
        page.value = 1
        
        // Quitar el destacado después de 5 segundos para que vuelva al orden normal
        setTimeout(() => {
          recentlyCreatedId.value = null
        }, 5000)
      } else {
        // Si no viene en la respuesta, hacer una recarga mínima después de un delay
        setTimeout(async () => {
          await fetchArmas(false) // No preservar estado para mostrar el nuevo registro al principio
          page.value = 1 // Ir a la primera página
          console.log(`✅ ${mode === 'create' ? 'Creación' : 'Edición'} completada y datos recargados`)
        }, 500)
      }
    } else if (mode === 'edit') {
      // Para editar, actualizar el registro existente
      const updatedArma = responseData.value?.data || { ...payload, id: data.id }
      
      updateArmaInTable(updatedArma, false) // No es un registro nuevo
    }
    
    console.log(`✅ ${mode === 'create' ? 'Creación' : 'Edición'} completada exitosamente sin recargar tabla`)
  } catch (error) {
    // Manejo de errores
    console.error('❌ Error al guardar:', error)
    console.error('❌ Error completo:', JSON.stringify(error, null, 2))
    console.log('❌ Errores detallados:', error?.data?.errors)
    
    // Si hay errores de validación de Laravel, mostrarlos
    if (error?.data?.errors) {
      formErrors.value = error.data.errors
      console.error('❌ Errores de validación:', error.data.errors)
    } else {
      formErrors.value = {}
    }
    
    // Mostrar el error específico del servidor
    if (error?.data?.message) {
      showErrorMessage('❌ Error del Servidor', error.data.message)
    } else if (error?.message) {
      showErrorMessage('❌ Error de Operación', error.message)
    } else {
      showErrorMessage('❌ Error Desconocido', 'No se pudieron guardar los datos')
    }
    
    console.error('❌ Operación fallida:', {
      mode,
      payload,
      error: error?.data || error,
    })
  }
}

// --- Opciones de la tabla ---
const itemsPerPage = ref(10) // Cantidad de filas por página
const page = ref(1) // Página actual
const sortBy = ref() // Columna para ordenar
const orderBy = ref() // Orden (asc/desc)

// Actualiza las opciones de la tabla (orden, página, etc.)
const updateOptions = options => {
  // Limpiar el ID recién creado si se cambia el ordenamiento o la página
  if (recentlyCreatedId.value) {
    recentlyCreatedId.value = null
  }
  
  sortBy.value = options.sortBy[0]?.key
  orderBy.value = options.sortBy[0]?.order
}

// --- Definición de columnas de la tabla ---
const headers = [
 
  { title: '', key: 'data-table-select', sortable: false },
  { title: 'ID', key: 'id' },
  { title: 'Código', key: 'codigo' },
  { title: 'Descripción', key: 'descripcion' },
  { title: 'Abreviatura', key: 'abreviatura' },
  { title: 'Posición', key: 'posicion' },
  { title: 'Estado', key: 'status' },
  { title: 'Acciones', key: 'actions', sortable: false },

]

// Cabeceras adaptativas para móviles
const mobileHeaders = [
  { title: '', key: 'data-table-select', sortable: false, width: '50px' },
  { title: 'Información del Arma', key: 'mobile-info', sortable: false },
]

// Computed para determinar si está en vista móvil
const isMobile = computed(() => {
  return smAndDown.value
})

// --- Obtención de datos de armas desde la API ---
const armaData = ref(null)
const apiError = ref(null)
const isFetching = ref(false)

// Función para cargar armas con fetch directo para mejor control
const fetchArmas = async (preserveState = false) => {
  isFetching.value = true
  apiError.value = null
  
  // Guardar el estado actual si se solicita preservarlo
  const currentSortBy = preserveState ? sortBy.value : null
  const currentOrderBy = preserveState ? orderBy.value : null
  const currentPage = preserveState ? page.value : null
  
  try {
    // Agregar timestamp para evitar caché
    const timestamp = Date.now()
    const url = `${API_BASE_URL}/armas?_t=${timestamp}`
    
    console.log('Iniciando petición a:', url)
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos timeout
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    
    console.log('Respuesta recibida:', response.status, response.statusText)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()

    console.log('Datos recibidos:', data)
    
    armaData.value = data
    apiError.value = null
    
    // Restaurar el estado si se solicitó preservarlo
    if (preserveState) {
      if (currentSortBy) sortBy.value = currentSortBy
      if (currentOrderBy) orderBy.value = currentOrderBy
      if (currentPage) page.value = currentPage
    }
    
  } catch (error) {
    console.error('Error en fetchArmas:', error)
    
    if (error.name === 'AbortError') {
      apiError.value = '⏰ La petición fue cancelada (timeout de 30 segundos)'
    } else if (error.message.includes('fetch')) {
      apiError.value = '🌐 Error de conexión: No se puede conectar con el servidor'
    } else {
      apiError.value = error.message || '❌ Error desconocido'
    }
    
    armaData.value = null
  } finally {
    isFetching.value = false
  }
}

// Ejecutar la carga inicial
onMounted(async () => {
  try {
    console.log('Iniciando carga de armas...')
    console.log('URL de la API:', `${API_BASE_URL}/armas`)
    await fetchArmas()
    console.log('Carga de armas completada')
  } catch (error) {
    console.error('Error al cargar armas:', error)
    console.error('Error completo:', JSON.stringify(error, null, 2))
    
    // Mostrar error más específico
    if (error?.message) {
      console.error('Mensaje de error:', error.message)
    }
    if (error?.response) {
      console.error('Respuesta del servidor:', error.response)
    }
    
    // Si es un error de timeout o abort, intentar nuevamente después de un delay
    if (error?.message?.includes('aborted') || error?.message?.includes('timeout')) {
      console.log('Reintentando carga en 3 segundos...')
      setTimeout(async () => {
        try {
          await fetchArmas(true) // Preservar estado en reintentos
          console.log('Recarga exitosa')
        } catch (retryError) {
          console.error('Error en reintento:', retryError)
        }
      }, 3000)
    }
  }
})

// Debug para ver qué datos estamos recibiendo
watchEffect(() => {
  console.log('ArmaData:', armaData.value)
  console.log('API Error:', apiError.value)
  console.log('Is Fetching:', isFetching.value)
})

// Limpiar el ID recién creado cuando se cambie la búsqueda o el filtro
watch([searchQuery, selectedStatus], () => {
  if (recentlyCreatedId.value) {
    recentlyCreatedId.value = null
  }
})

// Watcher para limpiar selección cuando se cambie de página o filtros
watch([page, searchQuery, selectedStatus], () => {
  selectedRows.value = []
  selectAll.value = false
})

// Función de prueba para verificar rutas de restauración
const testRestoreRoutes = async (armaId = 1) => {
  console.log('🧪 Iniciando prueba de rutas de restauración...')
  
  const routes = [
    `/armas/restore/${armaId}`,
    `/armas/${armaId}/restore`, 
    `/armas/restaurar/${armaId}`,
    `/armas/${armaId}/restaurar`,
  ]
  
  const methods = ['POST', 'PUT', 'PATCH']
  
  for (const route of routes) {
    for (const method of methods) {
      try {
        console.log(`🧪 Probando: ${method} ${route}`)
        
        const response = await fetch(`${API_BASE_URL}${route}`, {
          method,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
        
        console.log(`✅ ${method} ${route} - Status: ${response.status}`)
        if (response.status !== 404 && response.status !== 405) {
          console.log(`🎯 Ruta funcional encontrada: ${method} ${route}`)
          break
        }
      } catch (error) {
        console.log(`❌ ${method} ${route} - Error: ${error.message}`)
      }
    }
  }
}

// Función de prueba para verificar rutas de eliminados
const testDeletedRoutes = async () => {
  console.log('🧪 Iniciando prueba de rutas de eliminados...')
  
  const routes = [
    '/armas/deleted',
    '/armas/eliminados', 
    '/armas/deleted/list',
    '/armas/eliminados/list',
    '/armas?deleted=true',
    '/armas?eliminados=true',
  ]
  
  for (const route of routes) {
    try {
      console.log(`🧪 Probando: GET ${route}`)
      
      const response = await fetch(`${API_BASE_URL}${route}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`✅ GET ${route} - Status: ${response.status}`)
      
      if (response.status !== 404) {
        console.log(`🎯 Ruta funcional encontrada: GET ${route}`)
        
        try {
          const data = await response.json()

          console.log('📄 Respuesta:', data)
        } catch (jsonError) {
          console.log('📄 Error al parsear JSON:', jsonError)

          const text = await response.text()

          console.log('📄 Respuesta como texto:', text)
        }
        break
      }
    } catch (error) {
      console.log(`❌ GET ${route} - Error: ${error.message}`)
    }
  }
}

// Función de reintento manual
const retryLoadData = async () => {
  try {
    console.log('Reintentando carga manual...')
    await fetchArmas(true) // Preservar el estado actual
    console.log('Recarga manual exitosa')
    showSuccessMessage('✅ Conexión Restaurada', 'Los datos se han cargado correctamente')
  } catch (error) {
    console.error('Error en recarga manual:', error)
    showErrorMessage('❌ Error de Conexión', 'No se pudo restablecer la conexión con el servidor')
  }
}

// --- Computed para filtrar y paginar localmente los datos ---
const armas = computed(() => {
  // Verificar si hay datos antes de procesar
  if (!armaData.value || !armaData.value.data) {
    console.log('No hay datos de armas disponibles')
    
    return []
  }

  let allData = armaData.value.data ?? []

  // Filtro por estado (Activo/Inactivo)
  if (selectedStatus.value) {
    allData = allData.filter(item => item.arma_estado === selectedStatus.value)
  }

  // Filtro local por búsqueda
  if (searchQuery.value) {
    allData = allData.filter(item =>
      (item.arma_cod ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_descripcion ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_abreviacion ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_posicion ?? '').toString().includes(searchQuery.value),
    )
  }

  // Aplicar ordenamiento si hay una columna seleccionada
  if (sortBy.value && orderBy.value) {
    allData = allData.sort((a, b) => {
      let aValue, bValue

      // Mapear las keys a los nombres de columnas reales en la base de datos
      switch (sortBy.value) {
      case 'id':
        aValue = a.id
        bValue = b.id
        break
      case 'codigo':
        aValue = a.arma_cod ?? ''
        bValue = b.arma_cod ?? ''
        break
      case 'descripcion':
        aValue = a.arma_descripcion ?? ''
        bValue = b.arma_descripcion ?? ''
        break
      case 'abreviatura':
        aValue = a.arma_abreviacion ?? ''
        bValue = b.arma_abreviacion ?? ''
        break
      case 'posicion':
        aValue = Number(a.arma_posicion) || 0
        bValue = Number(b.arma_posicion) || 0
        break
      case 'status':
        aValue = a.arma_estado ?? ''
        bValue = b.arma_estado ?? ''
        break
      default:
        return 0
      }

      // Ordenamiento para números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return orderBy.value === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Ordenamiento para strings (convertir a minúsculas para comparación insensible a mayúsculas)
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (orderBy.value === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  } else {
    // Ordenamiento por defecto: ID ascendente (del primero al último)
    allData = allData.sort((a, b) => {
      // Si hay un registro recién creado, mostrarlo al principio temporalmente
      if (recentlyCreatedId.value) {
        if (a.id === recentlyCreatedId.value) return -1
        if (b.id === recentlyCreatedId.value) return 1
      }
      
      // Ordenamiento normal por ID ascendente
      return (a.id || 0) - (b.id || 0)
    })
  }

  // Paginación local
  const start = (page.value - 1) * itemsPerPage.value
  const end = itemsPerPage.value === -1 ? allData.length : start + itemsPerPage.value

  return allData.slice(start, end)
})

// --- Computed para el total de armas (después del filtro, antes de paginar) ---
const totalArmas = computed(() => {
  let allData = armaData.value?.data ?? []
  
  // Filtro por estado (Activo/Inactivo)
  if (selectedStatus.value) {
    allData = allData.filter(item => item.arma_estado === selectedStatus.value)
  }
  
  // Filtro por búsqueda
  if (searchQuery.value) {
    allData = allData.filter(item =>
      (item.arma_cod ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_descripcion ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_abreviacion ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  return allData.length
})

// --- Computed para verificar si todos los elementos de la página actual están seleccionados ---
const areAllCurrentPageSelected = computed(() => {
  if (!armas.value || armas.value.length === 0) return false
  
  const currentPageIds = armas.value.map(arma => arma.id)
  const selectedInCurrentPage = selectedRows.value.filter(id => currentPageIds.includes(id))
  
  return selectedInCurrentPage.length === currentPageIds.length
})

// --- Elimina un arma ---
const deleteArma = async id => {
  try {
    // Buscar los datos del arma antes de eliminarla
    const armaToDelete = armaData.value?.data?.find(arma => arma.id === id)
    
    console.log('Eliminando arma con ID:', id)
    console.log('Datos del arma a eliminar:', armaToDelete)
    
    const response = await useApi(`/armas/${id}`, { method: 'DELETE' })
    
    console.log('Respuesta de eliminación:', response)

    // Guardar los datos del arma eliminada para poder restaurarla
    if (armaToDelete) {
      console.log('Arma guardada para restaurar:', armaToDelete)
      
      // Mostrar modal de eliminación en lugar de alerta
      showDeletedMessage(armaToDelete)
    }

    // Elimina de la selección si estaba seleccionada
    const index = selectedRows.value.findIndex(row => row === id)
    if (index !== -1)
      selectedRows.value.splice(index, 1)

    // Remover el registro de la tabla sin recargar
    removeArmaFromTable(id)
    
    console.log('Eliminación completada exitosamente sin recargar tabla')
    
  } catch (error) {
    console.error('Error al eliminar arma:', error)
    console.error('Error completo:', JSON.stringify(error, null, 2))
    
    // Mostrar mensaje de error al usuario
    showErrorMessage('❌ Error de Eliminación', `No se pudo eliminar el registro: ${error.message || 'Error desconocido'}`)
  }
}

const openDeleteDialog = id => {
  // Buscar el arma que se va a eliminar para mostrar su información
  const armaToDelete = armaData.value?.data?.find(arma => arma.id === id)
  if (armaToDelete) {
    deletedArma.value = { ...armaToDelete } // Pre-cargar los datos
  }
  
  armaIdToDelete.value = id
  isDialogVisibleDelete.value = true
}

const confirmDeleteArma = async () => {
  await deleteArma(armaIdToDelete.value)
  isDialogVisibleDelete.value = false
}

// Función para manejar la cancelación de eliminación
const handleCancelDelete = () => {
  isDialogVisibleDelete.value = false
  showCancelConfirmation.value = true
}

// Función para cerrar el modal de confirmación de cancelación
const closeCancelConfirmation = () => {
  showCancelConfirmation.value = false
}

// Función para abrir el modal de confirmación de eliminación múltiple
const openDeleteMultipleDialog = () => {
  if (selectedRows.value.length === 0) {
    showErrorMessage('⚠️ Sin Selección', 'No hay registros seleccionados para eliminar')
    
    return
  }
  
  isDialogVisibleDeleteMultiple.value = true
}

// Función para cerrar el modal de confirmación de eliminación múltiple
const closeDeleteMultipleDialog = () => {
  isDialogVisibleDeleteMultiple.value = false
}

// Función para actualizar un registro específico en la tabla sin recargar todo
const updateArmaInTable = (updatedArma, isNewRecord = false) => {
  if (!armaData.value?.data) return
  
  const index = armaData.value.data.findIndex(arma => arma.id === updatedArma.id)
  if (index !== -1) {
    // Actualizar el registro existente manteniendo la estructura
    armaData.value.data[index] = { ...armaData.value.data[index], ...updatedArma }
    console.log('✅ Registro actualizado en tabla sin recargar:', updatedArma)
  } else {
    // Si no existe, agregarlo al final de la lista (el ordenamiento se maneja en el computed)
    armaData.value.data.push(updatedArma)
    console.log('✅ Registro agregado a la tabla sin recargar:', updatedArma)
  }
}

// Función para remover un registro específico de la tabla sin recargar todo
const removeArmaFromTable = armaId => {
  if (!armaData.value?.data) return
  
  const index = armaData.value.data.findIndex(arma => arma.id === armaId)
  if (index !== -1) {
    armaData.value.data.splice(index, 1)
    console.log('✅ Registro removido de tabla sin recargar:', armaId)
  }
}

// Función para restaurar el arma eliminada
const restoreArma = async () => {
  if (!deletedArma.value) {
    console.error('No hay datos del arma eliminada para restaurar')
    
    return
  }
  
  // Guardar la referencia del arma antes de que pueda ser limpiada
  const armaToRestore = { ...deletedArma.value }
  
  console.log('🔄 Iniciando restauración del arma:', armaToRestore)
  isRestoring.value = true
  
  try {
    console.log('🔄 Llamando al endpoint de restauración...')

    // Usar la ruta definida en el backend: POST /armas/{id}/restore
    const routeUsed = `/armas/${armaToRestore.id}/restore`

    console.log('🔄 Usando ruta:', routeUsed)
    
    const { data: responseData, error } = await useApi(routeUsed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (error.value) {
      throw error.value
    }

    console.log('🔄 Respuesta de restauración:', responseData.value)

    // Actualizar solo este registro en la tabla sin recargar
    const restoredArma = responseData.value?.data || armaToRestore
    
    updateArmaInTable(restoredArma, false) // No es un registro nuevo, es una restauración

    // Mostrar mensaje de éxito usando la referencia guardada
    showSuccessMessage('✅ Restauración Exitosa', `Arma "${armaToRestore.arma_descripcion}" restaurada correctamente`)

    // Ocultar el modal de eliminación
    showDeletedModal.value = false
    deletedArma.value = null
    
    console.log('✅ Restauración completada exitosamente sin recargar tabla')
    
  } catch (error) {
    console.error('❌ Error al restaurar arma:', error)
    console.error('❌ Error completo:', JSON.stringify(error, null, 2))
    
    // Si hay errores de validación, mostrarlos
    if (error?.data?.errors) {
      console.error('❌ Errores de validación:', error.data.errors)
    }
    
    // Mostrar mensaje de error al usuario con más detalle
    let errorMessage = 'Error desconocido'
    if (error?.data?.message) {
      errorMessage = error.data.message
    } else if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    // Cambiar a mostrar error en lugar de success
    showErrorMessage('❌ Error de Restauración', `No se pudo restaurar el arma: ${errorMessage}`)
    
  } finally {
    isRestoring.value = false
  }
}

// Función para cerrar el modal de eliminación sin restaurar
const dismissDeletedAlert = () => {
  showDeletedModal.value = false
  deletedArma.value = null
}

// --- Funciones para selección múltiple ---

// Función para manejar la selección de todos los elementos
const toggleSelectAll = () => {
  // Verificar si todos los elementos actuales están seleccionados
  const currentPageIds = armas.value.map(arma => arma.id)
  const selectedInCurrentPage = selectedRows.value.filter(id => currentPageIds.includes(id))
  const allSelected = selectedInCurrentPage.length === currentPageIds.length && currentPageIds.length > 0
  
  if (allSelected) {
    // Deseleccionar todos los elementos de la página actual
    selectedRows.value = selectedRows.value.filter(id => !currentPageIds.includes(id))
    selectAll.value = false
  } else {
    // Seleccionar todos los elementos de la página actual
    // Primero remover los que ya están seleccionados de esta página
    selectedRows.value = selectedRows.value.filter(id => !currentPageIds.includes(id))
    
    // Luego agregar todos los de la página actual
    selectedRows.value.push(...currentPageIds)
    selectAll.value = true
  }
  
  // Actualizar el estado después del cambio
  updateSelectAllState()
}

// Función para manejar la selección individual
const toggleRowSelection = armaId => {
  const index = selectedRows.value.findIndex(id => id === armaId)
  if (index === -1) {
    // Agregar a la selección
    selectedRows.value.push(armaId)
  } else {
    // Remover de la selección
    selectedRows.value.splice(index, 1)
  }
  
  // Actualizar el estado del checkbox "Seleccionar Todos"
  updateSelectAllState()
}

// Función para actualizar el estado del checkbox "Seleccionar Todos"
const updateSelectAllState = () => {
  const currentPageIds = armas.value.map(arma => arma.id)
  const selectedInCurrentPage = selectedRows.value.filter(id => currentPageIds.includes(id))
  
  if (selectedInCurrentPage.length === 0) {
    selectAll.value = false
  } else if (selectedInCurrentPage.length === currentPageIds.length) {
    selectAll.value = true
  } else {
    selectAll.value = false // Estado indeterminado (parcialmente seleccionado)
  }
}

// Función para verificar si una fila está seleccionada
const isRowSelected = armaId => {
  return selectedRows.value.includes(armaId)
}

// Función para eliminar todos los elementos seleccionados
const deleteSelectedArmas = async () => {
  isDeleting.value = true
  
  const errors = []
  const successes = []
  const selectedIds = [...selectedRows.value] // Copia de los IDs seleccionados

  try {
    // Eliminar uno por uno para tener mejor control de errores
    for (const armaId of selectedIds) {
      try {
        console.log(`🗑️ Eliminando arma ID: ${armaId}`)
        
        const response = await useApi(`/armas/${armaId}`, { method: 'DELETE' })
        
        if (response.error.value) {
          throw response.error.value
        }

        // Remover de la tabla local sin recargar
        removeArmaFromTable(armaId)
        successes.push(armaId)
        
        console.log(`✅ Arma ${armaId} eliminada exitosamente`)
        
      } catch (error) {
        console.error(`❌ Error al eliminar arma ${armaId}:`, error)
        errors.push({ id: armaId, error: error.message || 'Error desconocido' })
      }
    }

    // Limpiar selección después de procesar
    selectedRows.value = []
    selectAll.value = false

    // Cerrar el modal de confirmación
    closeDeleteMultipleDialog()

    // Mostrar resultado según el estado de la operación
    if (errors.length === 0) {
      showSuccessMessage(
        '✅ Eliminación Completada', 
        `Se eliminaron exitosamente ${successes.length} registro${successes.length > 1 ? 's' : ''}`,
      )
    } else if (successes.length === 0) {
      showErrorMessage(
        '❌ Error en Eliminación', 
        `No se pudo eliminar ningún registro. Errores: ${errors.length}`,
      )
    } else {
      showErrorMessage(
        '⚠️ Eliminación Parcial', 
        `Se eliminaron ${successes.length} registros exitosamente, pero ${errors.length} fallaron`,
      )
    }

  } catch (error) {
    console.error('❌ Error general en eliminación múltiple:', error)
    showErrorMessage('❌ Error General', 'Ocurrió un error durante la eliminación múltiple')
  } finally {
    isDeleting.value = false
  }
}

// Función para obtener la lista de registros eliminados
const fetchDeletedArmas = async () => {
  isFetchingDeleted.value = true
  
  try {
    console.log('🗑️ Obteniendo lista de armas eliminadas...')
    
    // Usar la ruta definida en el backend: GET /armas/deleted
    const routeUsed = '/armas/deleted'

    console.log('🗑️ Usando ruta:', routeUsed)
    console.log('🗑️ URL completa:', `${API_BASE_URL}${routeUsed}`)
    
    const { data: responseData, error } = await useApi(routeUsed, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    })

    console.log('🗑️ Error de la petición:', error.value)
    console.log('🗑️ Datos de respuesta:', responseData.value)

    if (error.value) {
      console.error('🗑️ Error en la petición:', error.value)
      throw error.value
    }

    console.log('🗑️ Respuesta de eliminados:', responseData.value)

    // Verificar si hay datos en la respuesta
    if (responseData.value?.data) {
      deletedArmas.value = responseData.value.data
      console.log('🗑️ Datos asignados desde responseData.value.data:', deletedArmas.value)
    } else if (Array.isArray(responseData.value)) {
      deletedArmas.value = responseData.value
      console.log('🗑️ Datos asignados desde responseData.value (array):', deletedArmas.value)
    } else {
      deletedArmas.value = []
      console.log('🗑️ No se encontraron datos, asignando array vacío')
    }

    // Ordenar los registros eliminados del más reciente al más antiguo
    if (deletedArmas.value && deletedArmas.value.length > 0) {
      deletedArmas.value.sort((a, b) => {
        // Intentar ordenar por deleted_at si existe
        if (a.deleted_at && b.deleted_at) {
          return new Date(b.deleted_at) - new Date(a.deleted_at)
        }
        
        // Si no hay deleted_at, ordenar por updated_at
        if (a.updated_at && b.updated_at) {
          return new Date(b.updated_at) - new Date(a.updated_at)
        }
        
        // Como último recurso, ordenar por ID descendente (más alto primero)
        
        return (b.id || 0) - (a.id || 0)
      })
      console.log('🗑️ Registros eliminados ordenados por fecha (más reciente primero)')
    }
    
    console.log('🗑️ Armas eliminadas cargadas:', deletedArmas.value.length)
    console.log('🗑️ Contenido de deletedArmas.value:', deletedArmas.value)
    
  } catch (error) {
    console.error('❌ Error al obtener armas eliminadas:', error)
    console.error('❌ Error completo:', JSON.stringify(error, null, 2))
    
    let errorMessage = 'Error desconocido'
    if (error?.data?.message) {
      errorMessage = error.data.message
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    console.error('❌ Mensaje de error procesado:', errorMessage)
    showErrorMessage('❌ Error al Cargar Eliminados', `No se pudieron cargar los registros eliminados: ${errorMessage}`)
    deletedArmas.value = []
    
  } finally {
    isFetchingDeleted.value = false
    console.log('🗑️ fetchDeletedArmas finalizado. isFetchingDeleted:', isFetchingDeleted.value)
  }
}

// Función para abrir el modal de registros eliminados
const openDeletedListModal = async () => {
  isDeletedListVisible.value = true
  await fetchDeletedArmas()
}

// Función para cerrar el modal de registros eliminados
const closeDeletedListModal = () => {
  isDeletedListVisible.value = false
  deletedArmas.value = []
}

// Función para restaurar desde la lista de eliminados
const restoreFromList = async arma => {
  if (!arma || !arma.id) {
    console.error('❌ No hay datos válidos del arma para restaurar:', arma)
    showErrorMessage('❌ Error de Validación', 'Datos del arma no válidos para restaurar')
    
    return
  }
  
  console.log('🔄 Restaurando desde lista:', arma)
  
  // Guardar referencia de los datos del arma
  const armaToRestore = { ...arma }
  
  isRestoringFromList.value = true
  
  try {
    // Usar la misma ruta que funciona en restoreArma: POST /armas/{id}/restore
    const routeUsed = `/armas/${armaToRestore.id}/restore`
    
    console.log('🔄 Restaurando con ruta:', routeUsed)
    
    const { data: responseData, error } = await useApi(routeUsed, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (error.value) {
      throw error.value
    }

    console.log('🔄 Respuesta de restauración desde lista:', responseData.value)

    // Actualizar solo este registro en la tabla principal sin recargar
    const restoredArma = responseData.value?.data || armaToRestore
    
    updateArmaInTable(restoredArma, false) // No es un registro nuevo, es una restauración

    // Mostrar mensaje de éxito usando la referencia guardada
    showSuccessMessage('✅ Restauración Exitosa', `Arma "${armaToRestore.arma_descripcion || armaToRestore.arma_cod || 'ID: ' + armaToRestore.id}" restaurada correctamente`)

    // Solo recargar la lista de eliminados para actualizarla
    await fetchDeletedArmas()
    
    console.log('🔄 Restauración desde lista completada exitosamente sin recargar tabla principal')
    
  } catch (error) {
    console.error('❌ Error al restaurar arma desde lista:', error)
    console.error('❌ Error completo:', JSON.stringify(error, null, 2))
    
    let errorMessage = 'Error desconocido'
    if (error?.data?.message) {
      errorMessage = error.data.message
    } else if (error?.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    console.error('❌ Mensaje de error procesado:', errorMessage)
    showErrorMessage('❌ Error de Restauración', `No se pudo restaurar el arma: ${errorMessage}`)
  } finally {
    isRestoringFromList.value = false
  }
}

// --- Devuelve el color y el icono según el estado del arma ---
const resolveArmaStatusVariantAndIcon = status => {
  if (status === 'Activo')
    return {
      variant: 'activos',
      icon: 'tabler-check',
    }
  if (status === 'Inactivo')
    return {
      variant: 'inactivos',
      icon: 'tabler-ban',
    }
}

// --- Helper para obtener datos filtrados para exportación ---
const getFilteredDataForExport = () => {
  // Verificar si hay datos antes de procesar
  if (!armaData.value || !armaData.value.data) {
    console.log('No hay datos de armas disponibles para exportar')
    
    return []
  }

  let allData = armaData.value.data ?? []

  // Aplicar el mismo filtrado que en el computed 'armas' pero sin paginación
  
  // Filtro por estado (Activo/Inactivo)
  if (selectedStatus.value) {
    allData = allData.filter(item => item.arma_estado === selectedStatus.value)
  }

  // Filtro local por búsqueda
  if (searchQuery.value) {
    allData = allData.filter(item =>
      (item.arma_cod ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_descripcion ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_abreviacion ?? '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (item.arma_posicion ?? '').toString().includes(searchQuery.value),
    )
  }

  // Aplicar ordenamiento si hay una columna seleccionada
  if (sortBy.value && orderBy.value) {
    allData = allData.sort((a, b) => {
      let aValue, bValue

      // Mapear las keys a los nombres de columnas reales en la base de datos
      switch (sortBy.value) {
      case 'id':
        aValue = a.id
        bValue = b.id
        break
      case 'codigo':
        aValue = a.arma_cod ?? ''
        bValue = b.arma_cod ?? ''
        break
      case 'descripcion':
        aValue = a.arma_descripcion ?? ''
        bValue = b.arma_descripcion ?? ''
        break
      case 'abreviatura':
        aValue = a.arma_abreviacion ?? ''
        bValue = b.arma_abreviacion ?? ''
        break
      case 'posicion':
        aValue = Number(a.arma_posicion) || 0
        bValue = Number(b.arma_posicion) || 0
        break
      case 'status':
        aValue = a.arma_estado ?? ''
        bValue = b.arma_estado ?? ''
        break
      default:
        return 0
      }

      // Ordenamiento para números
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return orderBy.value === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Ordenamiento para strings (convertir a minúsculas para comparación insensible a mayúsculas)
      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (orderBy.value === 'asc') {
        return aStr.localeCompare(bStr)
      } else {
        return bStr.localeCompare(aStr)
      }
    })
  } else {
    // Ordenamiento por defecto: ID ascendente (del primero al último)
    allData = allData.sort((a, b) => {
      // Si hay un registro recién creado, mostrarlo al principio temporalmente
      if (recentlyCreatedId.value) {
        if (a.id === recentlyCreatedId.value) return -1
        if (b.id === recentlyCreatedId.value) return 1
      }
      
      // Ordenamiento normal por ID ascendente
      return (a.id || 0) - (b.id || 0)
    })
  }

  return allData
}

// --- Funciones de exportación ---
const isExporting = ref(false)

// --- Funciones de importación ---
const isImporting = ref(false)
const fileInput = ref(null)
const showImportFormatDialog = ref(false)

// Función para exportar a CSV
const exportToCSV = async () => {
  isExporting.value = true
  try {
    // Usar los datos filtrados localmente en lugar de hacer nueva petición a la API
    const armasData = getFilteredDataForExport()

    if (!armasData || armasData.length === 0) {
      throw new Error('No hay datos para exportar con los filtros actuales')
    }

    // Preparar los datos para CSV
    const csvHeaders = ['ID', 'Código', 'Descripción', 'Abreviatura', 'Posición', 'Estado']

    const csvData = armasData.map(arma => [
      arma.id,
      arma.arma_cod || '',
      arma.arma_descripcion || '',
      arma.arma_abreviacion || '',
      arma.arma_posicion || '',
      arma.arma_estado || '',
    ])

    // Crear contenido CSV
    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `armas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showSuccessMessage('✅ Exportación Exitosa', `Se han exportado ${armasData.length} registros a CSV (filtros aplicados)`)
  } catch (error) {
    console.error('Error al exportar CSV:', error)
    showErrorMessage('❌ Error de Exportación', `No se pudo exportar a CSV: ${error.message}`)
  } finally {
    isExporting.value = false
  }
}

// Función para exportar a Excel
const exportToExcel = async () => {
  isExporting.value = true
  try {
    // Usar los datos filtrados localmente en lugar de hacer nueva petición a la API
    const armasData = getFilteredDataForExport()

    if (!armasData || armasData.length === 0) {
      throw new Error('No hay datos para exportar con los filtros actuales')
    }
    
    // Crear contenido HTML para Excel
    let excelContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #333; }
            .header-container { display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #4F4F4F; padding-bottom: 15px; }
            .membrete { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; line-height: 1.4; }
            .membrete-item { margin-bottom: 5px; }
            .title-section { flex: 2; text-align: center; }
            .main-title { font-size: 24px; font-weight: bold; color: #2c3e50; margin: 0; text-transform: uppercase; }
            .date-info { margin-top: 10px; font-size: 11px; color: #666; }
            table { width: 100%; border-collapse: collapse; border: 2px solid #4F4F4F; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
            th { background-color: #4F4F4F !important; color: white !important; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { text-align: center; font-size: 10px; margin-top: 20px; }
          </style>
        </head>
        <body>
          
            <div class="title-section">
              <h1 class="main-title">REPORTE DE ARMAS</h1>
              <div class="date-info">
                <p>Fecha: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p>Hora: ${new Date().toLocaleTimeString('es-MX')}</p>
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Descripción</th>
                <th>Abreviatura</th>
                <th>Posición</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
    `
    
    armasData.forEach(arma => {
      excelContent += `
        <tr>
          <td>${arma.id}</td>
          <td>${arma.arma_cod || ''}</td>
          <td>${arma.arma_descripcion || ''}</td>
          <td>${arma.arma_abreviacion || ''}</td>
          <td>${arma.arma_posicion || ''}</td>
          <td>${arma.arma_estado || ''}</td>
        </tr>
      `
    })
    
    excelContent += `
            </tbody>
          </table>
          <div class="footer">
            <p><strong>Generado por el Sistema SPRODA V2.0</strong></p>
            <p>Total de registros: ${armasData.length}</p>
          </div>
        </body>
      </html>
    `

    // Crear y descargar archivo Excel
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_armas_${new Date().toISOString().split('T')[0]}.xls`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    showSuccessMessage('✅ Exportación Exitosa', `Se han exportado ${armasData.length} registros a Excel (filtros aplicados)`)
  } catch (error) {
    console.error('Error al exportar Excel:', error)
    showErrorMessage('❌ Error de Exportación', `No se pudo exportar a Excel: ${error.message}`)
  } finally {
    isExporting.value = false
  }
}

// Función para exportar a PDF
const exportToPDF = async () => {
  isExporting.value = true
  try {
    // Usar los datos filtrados localmente en lugar de hacer nueva petición a la API
    const armasData = getFilteredDataForExport()

    if (!armasData || armasData.length === 0) {
      throw new Error('No hay datos para exportar con los filtros actuales')
    }

    // Create HTML content for PDF with basic styling
    const htmlContent = createPDFContent(armasData)

    // Create new window and write content
    const printWindow = window.open('', '_blank')

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Show success message
    showSuccessMessage(
      '📄 PDF Listo para Descargar', 
      `Vista previa con ${armasData.length} registros abierta (filtros aplicados). Use "Archivo → Imprimir → Guardar como PDF"`,
    )

    console.log('PDF window opened successfully')
    
  } catch (error) {
    console.error('Error al exportar PDF:', error)
    showErrorMessage('❌ Error de Exportación', `No se pudo exportar a PDF: ${error.message}`)
  } finally {
    isExporting.value = false
  }
}

// Función para descargar PDF directamente usando HTML como archivo
const downloadPDFDirect = async () => {
  isExporting.value = true
  try {
    // Usar los datos filtrados localmente en lugar de hacer nueva petición a la API
    const armasData = getFilteredDataForExport()

    if (!armasData || armasData.length === 0) {
      throw new Error('No hay datos para exportar con los filtros actuales')
    }

    // Crear contenido HTML optimizado para PDF
    const htmlContent = createPDFContentForDownload(armasData)

    // Crear y descargar archivo HTML que se puede abrir como PDF
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `reporte_armas_${new Date().toISOString().split('T')[0]}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showSuccessMessage(
      '💾 Descarga PDF Iniciada', 
      `Archivo HTML con ${armasData.length} registros descargado (filtros aplicados). Ábrelo en el navegador y usa "Imprimir → Guardar como PDF"`,
    )

    console.log('PDF download completed successfully')
    
  } catch (error) {
    console.error('Error al descargar PDF:', error)
    showErrorMessage('❌ Error de Descarga PDF', `No se pudo descargar el PDF: ${error.message}`)
  } finally {
    isExporting.value = false
  }
}

// Helper function to create PDF content
const createPDFContent = armasData => {
  const reportDate = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  })

  const reportTime = new Date().toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
  })

  const tableRows = armasData.map(arma => 
    '<tr>' +
      '<td class="col-id">' + (arma.id || '') + '</td>' +
      '<td class="col-codigo">' + (arma.arma_cod || '') + '</td>' +
      '<td class="col-descripcion">' + (arma.arma_descripcion || '') + '</td>' +
      '<td class="col-abreviatura">' + (arma.arma_abreviacion || '') + '</td>' +
      '<td class="col-posicion">' + (arma.arma_posicion || '') + '</td>' +
      '<td class="col-estado">' + (arma.arma_estado || '') + '</td>' +
    '</tr>',
  ).join('')

  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
    '<meta charset="UTF-8">' +
    '<title>Reporte de Armas</title>' +
    '<style>' +
    'body { margin: 0; font-family: Arial, sans-serif; font-size: 12px;  }' +
  'table {'+
    'border-collapse: collapse;' +
    'margin: 20px 0;' +
    'font-size: 12px;' +
    


  'th, td {'+
    
    'padding: 10px;' +
    'text-align: left;' +
    'word-wrap: break-word; /* Evita que el texto se desborde */' +
  '}' +
  'th {' +
    'background-color: #4f4f4f;' +
    
  '}' +

  'tr:nth-child(even) {' +
    'background-color: #f9f9f9; /* Alterna colores para filas */' +
  '}' +

  'tr:hover {' +
    'background-color: #e0e0e0; /* Efecto al pasar el mouse */' +
  '}'+
  '</style>' +
'</head>' +
'<body>' +

    '<table border="0" width="100%">' +
    '<tr>' +
    '<td style="width: 40%; text-align: center;"><b>COMANDO GENERAL DEL EJÉRCITO<br>DEPARTAMENTO I - PERSONAL<br>BOLIVIA</b></td>' +
    '<td style="width:30%"></td>' +
    '<td style="width:40%">Fecha: ' + new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + '<br>Hora: ' + new Date().toLocaleTimeString('es-MX') + '</td>' +
    '</tr>' +
    '<tr style=" height:5px;">'+
    '<td colspan="3" style="text-align: center;"><b><strong><h1>REPORTE DE ARMAS</h1></strong></b></td>'+
    '</tr>'+
    '</table>'+
    '<table border="1" width="100%">' +
        '<thead>' +
            '<tr>' +
                '<th style="width: 8%; text-align: center;">ID</th>' +
                '<th style="width: 15%;">Código</th>' +
                '<th style="width: 35%;">Descripción</th>' +
                '<th style="width: 15%;">Abreviatura</th>' +
                '<th style="width: 12%; text-align: center;">Posición</th>' +
                '<th style="width: 15%; text-align: center;">Estado</th>' +
            '</tr>' +
        '</thead>' +
            tableRows +
        '</tbody>' +
    '</table>' +
    '<div class="footer">' +
        '<div>Generado por el Sistema SPRODA V2.0</div>' +
        '<div>Total de registros: ' + armasData.length + '</div>' +
    '</div>' +
    '</body>' +
    '</html>'
}

// Helper function to create PDF content for direct download
const createPDFContentForDownload = armasData => {
  const reportDate = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
  })

  const reportTime = new Date().toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
  })

  const tableRows = armasData.map(arma => 
    '<tr>' +
      '<td style="border: 1px solid #4f4f4f; padding: 6px 4px; text-align: center; width: 8%;">' + (arma.id || '') + '</td>' +
      '<td style="border: 1px solid #4f4f4f; padding: 6px 4px; width: 15%;">' + (arma.arma_cod || '') + '</td>' +
      '<td style="border: 1px solid #4f4f4f; padding: 6px 4px; width: 35%;">' + (arma.arma_descripcion || '') + '</td>' +
      '<td style="border: 1px solid #4f4f4f; padding: 6px 4px; width: 15%;">' + (arma.arma_abreviacion || '') + '</td>' +
      '<td style="border: 1px solid #4f4f4f; padding: 6px 4px; text-align: center; width: 12%;">' + (arma.arma_posicion || '') + '</td>' +
      '<td style="border: 1px solid #4f4f4f; padding: 6px 4px; text-align: center; width: 15%;">' + (arma.arma_estado || '') + '</td>' +
    '</tr>',
  ).join('')

  return '<!DOCTYPE html>' +
'<html>' +
'<head>' +
    '<meta charset="UTF-8">' +
    '<title>Reporte de Armas - ' + reportDate + '</title>' +
    '<style>' +
        '@page { size: A4; margin: 15mm; }' +
        '@media print {' +
            'body { margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #333; }' +
            '.no-print { display: none !important; }' +
            '.header-container { display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #4f4f4f; padding-bottom: 15px; }' +
            '.membrete { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px; line-height: 1.3; }' +
            '.title-section { flex: 2; text-align: center; }' +
            '.main-title { font-size: 16px; font-weight: bold; color: #2c3e50; margin: 0; text-transform: uppercase; }' +
          
           
            '.footer { margin-top: 15px; font-size: 8px; text-align: center; border-top: 1px solid #ccc; padding-top: 8px; display: flex; justify-content: space-between; }' +
        '}' +
        'body { margin: 20px; font-family: Arial, sans-serif; font-size: 12px; color: #333; background: white; }' +
        '.header-container { display: flex; align-items: center; margin-bottom: 25px; border-bottom: 2px solid #4f4f4f; padding-bottom: 15px; }' +
        '.membrete { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; line-height: 1.4; }' +
        '.membrete-item { margin-bottom: 5px; }' +
        '.title-section { flex: 2; text-align: center; }' +
        '.main-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin: 0; text-transform: uppercase; }' +
        '.date-info { margin-top: 8px; font-size: 10px; color: #666; }' +
        
       
        '.footer { margin-top: 20px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; display: flex; justify-content: space-between; }' +
        '.print-button { background-color: #4f4f4f; color: white; border: none; padding: 10px 20px; margin: 20px; border-radius: 5px; cursor: pointer; font-size: 14px; }' +
        '.print-button:hover { background-color: #333; }' +
    '</style>' +
'</head>' +
'<body>' +
    '<div class="no-print">' +
        '<button class="print-button" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>' +
    '</div>' +
    '<table style="width:100%">' +
    '<tr>' +
    '<td style="width: 40%; text-align: center;"><b>COMANDO GENERAL DEL EJÉRCITO<br>DEPARTAMENTO I - PERSONAL<br>BOLIVIA</b></td>' +
    '<td style="width:100px"></td>' +
    '<td style="width:50px">Fecha: ' + new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + '<br>Hora: ' + new Date().toLocaleTimeString('es-MX') + '</td>' +
    '</tr>' +
    '<tr>'+
    '<td colspan="3" style="text-align: center;"><b><strong><h2>REPORTE DE ARMAS</h2></strong></b></td>'+
    '</tr>'+
    '</table>'+
    '<table border="1" style="width:100%">' +
        '<thead>' +
            '<tr>' +
                '<th style="width: 8%; text-align: center;">ID</th>' +
                '<th style="width: 15%;">Código</th>' +
                '<th style="width: 35%;">Descripción</th>' +
                '<th style="width: 15%;">Abreviatura</th>' +
                '<th style="width: 12%; text-align: center;">Posición</th>' +
                '<th style="width: 15%; text-align: center;">Estado</th>' +
            '</tr>' +
        '</thead>' +
        '<tbody>' +
            tableRows +
        '</tbody>' +
    '</table>' +
    '<div class="footer">' +
        '<div>Generado por el Sistema SPRODA V2.0</div>' +
        '<div>Total de registros: ' + armasData.length + '</div>' +
    '</div>' +
'</body>' +
'</html>'
}

// Función para imprimir
const printTable = async () => {
  try {
    // Usar los datos filtrados localmente en lugar de hacer nueva petición a la API
    const armasData = getFilteredDataForExport()

    if (!armasData || armasData.length === 0) {
      throw new Error('No hay datos para imprimir con los filtros actuales')
    }
    
    // Crear contenido HTML para impresión usando arrays para evitar problemas de linting
    const htmlParts = []
    
    htmlParts.push('<html><head><title>Reporte de Armas</title>')

    // Eliminar CSS para evitar problemas de linting - usar solo HTML básico
    htmlParts.push('<style>')
    htmlParts.push('body { margin: 0; font-family: Arial, sans-serif; font-size: 11px; color: #333; }')
    htmlParts.push('</style>')
    htmlParts.push('</head><body>')
    htmlParts.push('<table style="width:100%"')
    htmlParts.push('<tr>')
    htmlParts.push('<td style="width:20px" align="center"><b> COMANDO GENERAL DEL EJÉRCITO<br>DEPARTAMENTO I - PERSONAL<br>BOLIVIA</b></td>')
    htmlParts.push('<td style="width:100px"></td>')
    htmlParts.push('<td style="width:50px">Fecha: ' + new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + '<br>Hora: ' + new Date().toLocaleTimeString('es-MX') + '</td>')
    htmlParts.push('</tr>')
    htmlParts.push('<tr>')
    htmlParts.push('<td colspan="3" align="center" valign="middle"><b><strong><h2>REPORTE DE ARMAS</h2></strong></b></td>')
    htmlParts.push('</tr>')
    htmlParts.push('</table>')
    
    htmlParts.push('<table border="1" style="width:100%"><thead><tr>')
    htmlParts.push('<th>ID</th><th>Código</th><th>Descripción</th><th>Abreviatura</th><th>Posición</th><th>Estado</th>')
    htmlParts.push('</tr></thead><tbody>')
    
    armasData.forEach(arma => {
      htmlParts.push('<tr>')
      htmlParts.push('<td>' + arma.id + '</td>')
      htmlParts.push('<td>' + (arma.arma_cod || '') + '</td>')
      htmlParts.push('<td>' + (arma.arma_descripcion || '') + '</td>')
      htmlParts.push('<td>' + (arma.arma_abreviacion || '') + '</td>')
      htmlParts.push('<td>' + (arma.arma_posicion || '') + '</td>')
      htmlParts.push('<td>' + (arma.arma_estado || '') + '</td>')
      htmlParts.push('</tr>')
    })
    
    htmlParts.push('</tbody></table>')
    htmlParts.push('<div class="footer">')
    htmlParts.push('<p>Generado por el Sistema SPRODA V2.0 </p>')
    htmlParts.push('</div>')
    htmlParts.push('</body></html>')
    
    const printContent = htmlParts.join('')

    // Abrir ventana de impresión
    const printWindow = window.open('', '_blank')

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
    
  } catch (error) {
    console.error('Error al imprimir:', error)
    showErrorMessage('❌ Error de Impresión', `No se pudo imprimir: ${error.message}`)
  }
}

// --- Funciones de importación ---

// Función para activar el input de archivo
const triggerFileInput = () => {
  showImportFormatDialog.value = true
}

// Función para continuar con la selección de archivo
const proceedWithFileSelection = () => {
  showImportFormatDialog.value = false
  fileInput.value?.click()
}

// Función para manejar la importación de archivo
const handleFileImport = async event => {
  const file = event.target.files[0]
  if (!file) return

  isImporting.value = true
  
  try {
    const fileExtension = file.name.split('.').pop().toLowerCase()
    
    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      throw new Error('Formato de archivo no soportado. Use: .xlsx, .xls o .csv')
    }

    const data = await readFileContent(file, fileExtension)
    
    if (!data || data.length === 0) {
      throw new Error('El archivo está vacío o no contiene datos válidos')
    }

    await processImportData(data)
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = ''
    
  } catch (error) {
    console.error('Error al importar archivo:', error)
    showErrorMessage('❌ Error de Importación', error.message)
    
    // Limpiar el input en caso de error también
    event.target.value = ''
  } finally {
    isImporting.value = false
  }
}

// Función para leer el contenido del archivo
const readFileContent = (file, extension) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = e => {
      try {
        const content = e.target.result
        
        if (extension === 'csv') {
          // Procesar archivo CSV
          const lines = content.split('\n')
          const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim())
          
          const data = []
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
              const values = lines[i].split(';').map(v => v.replace(/"/g, '').trim())
              const row = {}

              headers.forEach((header, index) => {
                row[header] = values[index] || ''
              })
              data.push(row)
            }
          }
          resolve(data)
        } else {
          // Para archivos Excel necesitaríamos una librería como SheetJS
          // Por simplicidad, por ahora solo soportamos CSV
          reject(new Error('Los archivos Excel requieren implementación adicional. Use formato CSV por ahora.'))
        }
      } catch (error) {
        reject(new Error('Error al procesar el archivo: ' + error.message))
      }
    }
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    
    if (extension === 'csv') {
      reader.readAsText(file, 'UTF-8')
    } else {
      reader.readAsArrayBuffer(file)
    }
  })
}

// Función para procesar los datos importados
const processImportData = async data => {
  console.log('Datos a importar:', data)
  
  // Validar estructura de datos esperada
  const expectedColumns = ['Código', 'Descripción', 'Abreviatura', 'Posición', 'Estado']
  const firstRow = data[0]
  const missingColumns = expectedColumns.filter(col => !Object.keys(firstRow).includes(col))
  
  if (missingColumns.length > 0) {
    throw new Error(`Faltan las siguientes columnas: ${missingColumns.join(', ')}`)
  }

  let successCount = 0
  let errorCount = 0
  const errors = []

  for (const [index, row] of data.entries()) {
    // Inicializar variables fuera del try-catch para que estén disponibles en catch
    let payload = null
    
    try {
      // Validar datos requeridos
      if (!row['Código'] || !row['Descripción']) {
        throw new Error(`Fila ${index + 2}: Código y Descripción son obligatorios`)
      }

      // Preparar payload para la API
      payload = {
        'arma_cod': row['Código'],
        'arma_descripcion': row['Descripción'],
        'arma_abreviacion': row['Abreviatura'] || '',
        'arma_posicion': row['Posición'] || '',
        'arma_estado': row['Estado'] || 'Activo',
      }

      // Debug: Mostrar payload antes de enviar
      console.log(`🔍 Enviando datos de fila ${index + 2}:`, payload)
      console.log(`🔍 Datos originales de fila ${index + 2}:`, row)

      // Enviar a la API (usar el mismo formato que handleArmaSubmit)
      console.log(`🚀 Iniciando llamada a API para fila ${index + 2}`)
      
      const response = await useApi('/armas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      
      console.log(`📡 Respuesta recibida fila ${index + 2}:`, response)
      console.log(`📡 Response.data fila ${index + 2}:`, response?.data)
      console.log(`📡 Response.error fila ${index + 2}:`, response?.error)
      
      // Verificar si hay error en la respuesta
      if (response.error && response.error.value) {
        console.error(`❌ Error en response.error fila ${index + 2}:`, response.error.value)
        throw response.error.value
      }
      
      successCount++
      
    } catch (error) {
      errorCount++
      
      // Capturar detalles específicos del error
      let errorMessage = `Fila ${index + 2}: `
      
      // Debug: Mostrar información completa del error
      console.error(`❌ Error completo fila ${index + 2}:`, error)
      console.error(`❌ Tipo de error fila ${index + 2}:`, typeof error)
      console.error(`❌ Error.data fila ${index + 2}:`, error?.data)
      console.error(`❌ Error.status fila ${index + 2}:`, error?.status)
      console.error(`❌ Error.statusCode fila ${index + 2}:`, error?.statusCode)
      console.error(`❌ Error.message fila ${index + 2}:`, error?.message)
      console.error(`❌ Error stringificado fila ${index + 2}:`, JSON.stringify(error, null, 2))
      
      if (error?.data?.errors) {
        // Errores de validación de Laravel
        console.error(`❌ Errores de validación fila ${index + 2}:`, error.data.errors)

        const validationErrors = Object.values(error.data.errors).flat()

        errorMessage += validationErrors.join(', ')
      } else if (error?.data?.message) {
        // Mensaje específico del servidor
        errorMessage += error.data.message
      } else if (error?.statusText) {
        // Status text del error HTTP
        errorMessage += `HTTP Error: ${error.statusText} (${error.status || error.statusCode || 'Sin código'})`
      } else if (error?.message) {
        // Mensaje general del error
        errorMessage += error.message
      } else if (error?.status === 422 || error?.statusCode === 422) {
        // Error 422 sin detalles específicos
        errorMessage += 'Error de validación en los datos enviados (422)'
      } else if (typeof error === 'string') {
        // Error como string
        errorMessage += error
      } else if (error?.toString && typeof error.toString === 'function') {
        // Intentar convertir error a string
        errorMessage += error.toString()
      } else {
        // Error genérico - mostrar tipo para debug
        errorMessage += `Error desconocido (tipo: ${typeof error})`
      }
      
      errors.push(errorMessage)
      console.error(`Error al importar fila ${index + 2}:`, error)
      console.error('Payload enviado:', payload || 'No se pudo generar payload')
      console.error('Datos de la fila:', row)
    }
  }

  // Mostrar resultados
  if (successCount > 0) {
    showSuccessMessage(
      '✅ Importación Completada', 
      `Se importaron ${successCount} registros exitosamente${errorCount > 0 ? ` (${errorCount} errores)` : ''}`,
    )
    
    // Recargar datos
    await fetchArmas()
  }

  if (errorCount > 0) {
    console.warn('Errores de importación:', errors)
    if (successCount === 0) {
      throw new Error(`No se pudo importar ningún registro. Errores: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`)
    }
  }
}

// Función para descargar el archivo de ejemplo
const downloadExampleFile = () => {
  try {
    // Crear el contenido del archivo de ejemplo
    const exampleContent = `Código;Descripción;Abreviatura;Posición;Estado
001;Infantería;47;1;Activo
002;Caballería;39;2;Activo
003;Artillería;82;3;Activo`

    // Crear el archivo con BOM para UTF-8 (para mejor compatibilidad con Excel)
    const bom = '\uFEFF'
    const finalContent = bom + exampleContent

    // Crear y descargar el archivo
    const blob = new Blob([finalContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', 'ejemplo_importacion_armas.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    showSuccessMessage(
      '📥 Archivo de Ejemplo Descargado', 
      'El archivo de ejemplo se ha descargado correctamente. Puede usarlo como plantilla para sus importaciones.',
    )

  } catch (error) {
    console.error('Error al descargar archivo de ejemplo:', error)
    showErrorMessage('❌ Error de Descarga', `No se pudo descargar el archivo de ejemplo: ${error.message}`)
  }
}

// Watcher para actualizar el estado del checkbox "Seleccionar Todos" cuando cambien los datos
// Se coloca al final para asegurar que todas las dependencias estén definidas
watch(armas, () => {
  updateSelectAllState()
}, { immediate: true })
</script>

<template>
  <section>
    <!-- Mensaje de error de API -->
    <div
      v-if="apiError"
      class="demo-space-y"
    >
      <VAlert
        type="error"
        variant="tonal"
      >
        <VAlertTitle>
          <VIcon 
            icon="tabler-alert-triangle" 
            size="20" 
            class="me-2" 
          />
          {{ t('errorLoadingData') }}
        </VAlertTitle>
        <div class="mt-2">
          <strong>Detalle del error:</strong><br>
          {{ apiError }}
        </div>
        <div class="mt-2 text-caption">
          <strong>{{ t('endpointAPI') }}:</strong> {{ API_BASE_URL }}/armas
        </div>
        <div class="mt-3">
          <VBtn
            color="error"
            variant="outlined"
            :loading="isFetching"
            @click="retryLoadData"
          >
            <VIcon icon="tabler-refresh" />
            {{ t('retryConnection') }}
          </VBtn>
        </div>
      </VAlert>
    </div>

    <!-- Indicador de carga -->
    <div
      v-if="isFetching"
      class="d-flex justify-center align-center pa-4"
    >
      <VProgressCircular
        indeterminate
        color="primary"
        size="24"
      />
      <span class="ms-2">
        <VIcon 
          icon="tabler-database" 
          size="116" 
          class="me-1" 
        />
        {{ t('loadingData') }}
      </span>
    </div>

    <!-- Contenido principal cuando hay datos -->
    <VCard
      v-if="!isFetching"
      id="arma-list"
    >
      <VCardText class="d-flex justify-space-between align-center flex-wrap gap-4">
        <div class="d-flex gap-4 align-center flex-wrap">
          <div class="d-flex align-center gap-2">
            <!-- Selector de cantidad de filas por página -->
            <span>{{ t('itemsPerPageLabel') }}</span>
            <AppSelect
              :model-value="itemsPerPage"
              :items="[
                { value: 10, title: '10' },
                { value: 25, title: '25' },
                { value: 50, title: '50' },
                { value: 100, title: '100' },
                { value: -1, title: 'Todos' },
              ]"
              style="inline-size: 7.5rem;"
              @update:model-value="itemsPerPage = parseInt($event, 10)"
            />
          </div>
          <!-- Botón para crear nueva arma -->
          <VBtn
            prepend-icon="tabler-plus"
            @click="openCreateModal"
          >
            <VIcon />
            {{ t('createNewRecord') }}
          </VBtn>

          <!-- Botón para importar desde Excel -->
          <VBtn
            color="info"
            variant="elevated"
            prepend-icon="tabler-upload"
            :loading="isImporting"
            :disabled="isImporting"
            @click="triggerFileInput"
          >
            <VIcon />
            {{ isImporting ? t('importing') : t('importExcel') }}
          </VBtn>

          <!-- Input oculto para seleccionar archivo -->
          <input
            ref="fileInput"
            type="file"
            accept=".xlsx,.xls,.csv"
            style="display: none;"
            @change="handleFileImport"
          >
          
          <!-- Botón para eliminar seleccionados -->
          <VBtn
            v-show="selectedRows.length > 0"
            prepend-icon="tabler-trash"
            color="error"
            variant="elevated"
            :loading="isDeleting"
            :disabled="isDeleting"
            @click="openDeleteMultipleDialog"
          >
            <VIcon />
            {{ isDeleting ? t('deleting') : t('deleteSelected') + ' (' + selectedRows.length + ')' }}
          </VBtn>
          
          <!-- Botón para ver registros eliminados -->
          <VBtn
            prepend-icon="tabler-trash"
            color="secondary"
            variant="outlined"
            @click="openDeletedListModal"
          >
            <VIcon />
            {{ t('deletedRecords') }}
          </VBtn>

          <!-- Botón de exportación -->
          <VMenu>
            <template #activator="{ props }">
              <VBtn
                v-bind="props"
                prepend-icon="tabler-upload"
                color="success"
                variant="outlined"
                :loading="isExporting"
                :disabled="isExporting"
              >
                <VIcon />
                {{ t('export') }}
                <VIcon 
                  icon="tabler-chevron-down" 
                  size="16" 
                  class="ms-1" 
                />
              </VBtn>
            </template>
            <VList>
              <VListItem
                prepend-icon="tabler-printer"
                :title="t('print')"
                @click="printTable"
              />
              <VListItem
                prepend-icon="tabler-file-text"
                :title="t('exportToCSV')"
                @click="exportToCSV"
              />
              <VListItem
                prepend-icon="tabler-file-spreadsheet"
                :title="t('exportToExcel')"
                @click="exportToExcel"
              />
              <VListItem
                prepend-icon="tabler-printer"
                :title="t('printWithPDFFormat')"
                @click="exportToPDF"
              />
              <VListItem
                prepend-icon="tabler-download"
                :title="t('downloadPDF')"
                @click="downloadPDFDirect"
              />
            </VList>
          </VMenu>
        </div>
        <div class="d-flex align-center flex-wrap gap-4">
          <!-- Campo de búsqueda -->
          <div class="arma-list-filter">
            <AppTextField
              v-model="searchQuery"
              :placeholder="t('search')"
            />
          </div>
          <!-- Selector de estado -->
          <div class="arma-list-filter">
            <AppSelect
              v-model="selectedStatus"
              :placeholder="t('selectStatus')"
              clearable
              clear-icon="tabler-x"
              single-line
              :items="[
                { value: 'Activo', title: 'Activo' },
                { value: 'Inactivo', title: 'Inactivo' }
              ]"
            />
          </div>
        </div>
      </VCardText>
      <VDivider />

      <!-- Botón para seleccionar todos en móvil -->
      <div 
        v-if="isMobile && armas.length > 0"
        class="pa-4 d-flex align-center justify-space-between bg-grey-lighten-5"
      >
        <div class="d-flex align-center gap-2">
          <VIcon
            icon="tabler-list-check"
            size="20"
            color="primary"
          />
          <span class="text-body-2 font-weight-medium">
            Selección múltiple
          </span>
        </div>
        
        <VBtn
          :color="areAllCurrentPageSelected ? 'error' : 'primary'"
          :variant="selectedRows.length > 0 ? 'elevated' : 'outlined'"
          size="small"
          @click="toggleSelectAll"
        >
          <VIcon
            :icon="areAllCurrentPageSelected ? 'tabler-square-minus' : 'tabler-square-check'"
            start
            size="16"
          />
          {{ areAllCurrentPageSelected ? t('deselectAll') : t('selectAll') }}
        </VBtn>
      </div>

      <!-- Tabla de datos -->
      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="page"
        :items-length="totalArmas"
        :headers="isMobile ? mobileHeaders : headers"
        :items="armas"
        item-value="id"
        :class="isMobile ? 'mobile-table' : 'text-no-wrap'"
        :mobile="isMobile"
        :mobile-breakpoint="600"
        @update:options="updateOptions"
      >
        <!-- Checkbox para seleccionar todos -->
        <template #header.data-table-select="{ }">
          <VCheckbox
            v-if="!isMobile"
            v-model="selectAll"
            :indeterminate="selectedRows.length > 0 && selectedRows.length < armas.length"
            @change="toggleSelectAll"
          />
        </template>
        
        <!-- Checkbox para seleccionar fila individual -->
        <template #item.data-table-select="{ item }">
          <VCheckbox
            :model-value="isRowSelected(item.id)"
            @update:model-value="toggleRowSelection(item.id)"
          />
        </template>

        <!-- Template especial para vista móvil -->
        <template #item.mobile-info="{ item }">
          <VCard
            v-if="isMobile"
            class="ma-2"
            variant="outlined"
          >
            <VCardText class="pa-4">
              <!-- Header con ID y Estado -->
              <div class="d-flex justify-space-between align-center mb-3">
                <VChip
                  :color="resolveArmaStatusVariantAndIcon(item.arma_estado).variant"
                  variant="tonal"
                  size="small"
                >
                  <VIcon
                    :icon="resolveArmaStatusVariantAndIcon(item.arma_estado).icon"
                    start
                    size="16"
                  />
                  {{ item.arma_estado }}
                </VChip>
                <VChip
                  color="primary"
                  variant="outlined"
                  size="small"
                >
                  ID: {{ item.id }}
                </VChip>
              </div>

              <!-- Información principal -->
              <div class="mb-3">
                <h6 class="text-h6 text-primary mb-1">
                  {{ item.arma_cod }} - {{ item.arma_abreviacion }}
                </h6>
                <p class="text-body-2 text-medium-emphasis mb-1">
                  {{ item.arma_descripcion }}
                </p>
                <div class="d-flex align-center gap-2">
                  <VIcon
                    icon="tabler-list-numbers"
                    size="16"
                    color="secondary"
                  />
                  <span class="text-caption">Posición: {{ item.arma_posicion }}</span>
                </div>
              </div>

              <!-- Acciones en móvil -->
              <div class="d-flex gap-2 justify-end">
                <VBtn
                  color="primary"
                  variant="tonal"
                  size="small"
                  icon="tabler-pencil"
                  @click="openEditModal(item)"
                />
                <VBtn
                  color="error"
                  variant="tonal"
                  size="small"
                  icon="tabler-trash"
                  @click="openDeleteDialog(item.id)"
                />
              </div>
            </VCardText>
          </VCard>
        </template>
        
        <!-- Renderiza la columna id -->
        <template #item.id="{ item }">
          {{ item.id }}
        </template>
        <!-- Renderiza la columna código -->
        <template #item.codigo="{ item }">
          {{ item.arma_cod }}
        </template>
        <!-- Renderiza la columna descripción -->
        <template #item.descripcion="{ item }">
          <div class="d-flex align-center">
            <div class="d-flex flex-column">
              {{ item.arma_descripcion }}
            </div>
          </div>
        </template>
        <!-- Renderiza la columna abreviatura -->
        <template #item.abreviatura="{ item }">
          {{ item.arma_abreviacion }}
        </template>
        <!-- Renderiza la columna posición -->
        <template #item.posicion="{ item }">
          {{ item.arma_posicion }}
        </template>
        <!-- Renderiza la columna estado con icono y color -->
        <template #item.status="{ item }">
          <VTooltip>
            <template #activator="{ props }">
              <VAvatar
                :size="28"
                v-bind="props"
                :color="resolveArmaStatusVariantAndIcon(item.arma_estado).variant"
                variant="tonal"
              >
                <VIcon
                  :size="16"
                  :icon="resolveArmaStatusVariantAndIcon(item.arma_estado).icon"
                />
              </VAvatar>
            </template>
            <p class="mb-0">
              {{ item.arma_estado || 'Sin estado' }}
            </p>
          </VTooltip>
        </template>
        <!-- Renderiza las acciones (editar y eliminar) -->
        <template #item.actions="{ item }">
          <IconBtn @click="openDeleteDialog(item.id)">
            <VIcon icon="tabler-trash" />
          </IconBtn>
          <IconBtn @click="openEditModal(item)">
            <VIcon icon="tabler-pencil" />
          </IconBtn>
        </template>
      </VDataTableServer>
    </VCard>

    <!-- Si no hay datos y no está cargando, muestra mensaje -->
    <VCard v-if="!isFetching && (!armaData || !armaData.data || armaData.data.length === 0)">
      <VCardText class="text-center pa-6">
        <VIcon 
          icon="tabler-database-off" 
          size="164" 
          class="text-grey-400 mb-3" 
        />
        <VCardTitle class="text-h5 mb-2">
          No hay datos disponibles
        </VCardTitle>
        <p class="text-body-2 text-grey-600 mb-4">
          No se encontraron registros de armas en la base de datos.
        </p>
        <VBtn
          color="primary"
          variant="outlined"
          @click="openCreateModal"
        >
          <VIcon icon="tabler-plus" />
          Crear Primer Registro
        </VBtn>
      </VCardText>
    </VCard>
  </section>
  <!-- Modal para crear/editar arma -->
  <ArmaInfoEditDialog
    :is-dialog-visible="isDialogVisible"
    :arma-data="selectedArma"
    :mode="formMode"
    :form-errors="formErrors"
    @submit="handleArmaSubmit"
    @update:is-dialog-visible="handleDialogClose"
  />

  <VDialog
    v-model="isDialogVisibleDelete"
    persistent
    class="v-dialog-sm"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="isDialogVisibleDelete = false" />

    <!-- Dialog Content -->
    <VCard
      title="Confirmar Eliminación"
      class="pa-sm-10 pa-2"
    >
      <VCardText>
        <div class="mb-4 text-center">
          <br class="text-body-1 mb-2">
          <VIcon 
            icon="tabler-alert-circle" 
            size="146" 
            class="me-2 text-warning" 
          />
          <div class="text-h2 font-weight-bold">
            ¿Estás seguro?
          </div>
          <div class="text-h5 font-weight-bold">
            Se eliminara el siguiente registro:
          </div>
          <div 
            v-if="deletedArma"
            class="pa-3 bg-grey-50 rounded text-left"
          >
            <div class="text-h6 mb-1">
              <VIcon 
                icon="tabler-shield-x" 
                size="16" 
                class="me-2 text-error" 
              />
              {{ deletedArma?.arma_descripcion || 'Sin descripción' }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              <VIcon 
                icon="tabler-hash" 
                size="14" 
                class="me-1" 
              />
              <strong>Código:</strong> {{ deletedArma?.arma_cod || 'Sin código' }}<br>
              <VIcon 
                icon="tabler-text-size" 
                size="14" 
                class="me-1" 
              />
              <strong>Abreviatura:</strong> {{ deletedArma?.arma_abreviacion || 'Sin abreviatura' }}<br>
              <VIcon 
                icon="tabler-sort-ascending-numbers" 
                size="14" 
                class="me-1" 
              />
              <strong>Posición:</strong> {{ deletedArma?.arma_posicion || 'Sin posición' }}
            </div>
          </div>
          
          <p class="text-body-2 text-error mt-3">
            <VIcon 
              icon="tabler-info-circle" 
              size="16" 
              class="me-1" 
            />
            El registro será marcado como eliminado (soft delete). Podrás restaurarlo usando "Rehacer Acción".
          </p>
        </div>
      </VCardText>
      
      <VCardText class="d-flex justify-end gap-3 flex-wrap">
        <VBtn
          color="secondary"
          variant="tonal"
          @click="handleCancelDelete"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="error"
          @click="confirmDeleteArma"
        >
          <VIcon icon="tabler-trash" />
          Eliminar
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>

  <!-- Modal de confirmación de cancelación de eliminación -->
  <VDialog
    v-model="showCancelConfirmation"
    max-width="400"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-info-circle"
          size="34"
          color="info"
        />
        Acción Cancelada
      </VCardTitle>

      <VCardText>
        <div class="d-flex align-center gap-3">
          <VIcon
            icon="tabler-circle-check"
            color="success"
            size="124"
          />
          <p class="mb-0">
            La eliminación ha sido cancelada exitosamente. El registro se mantiene sin cambios.
          </p>
        </div>
      </VCardText>
      
      <VCardActions class="justify-end">
        <VBtn
          color="primary"
          variant="elevated"
          @click="closeCancelConfirmation"
        >
          Entendido
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Modal de confirmación de eliminación múltiple -->
  <VDialog
    v-model="isDialogVisibleDeleteMultiple"
    max-width="500"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-alert-triangle"
          size="64"
          color="warning"
        />
        Confirmar Eliminación Múltiple
      </VCardTitle>

      <VCardText>
        <div class="d-flex align-center gap-3">
          <VIcon
            icon="tabler-trash"
            color="error"
            size="120"
          />
          <div>
            <p class="mb-1">
              ¿Estás seguro de que deseas eliminar <strong>{{ selectedRows.length }}</strong> 
              registro{{ selectedRows.length > 1 ? 's' : '' }}?
            </p>
            <p class="mb-0 text-caption text-medium-emphasis">
              Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
      </VCardText>
      
      <VCardActions class="justify-end gap-2">
        <VBtn
          color="secondary"
          variant="outlined"
          :disabled="isDeleting"
          @click="closeDeleteMultipleDialog"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="error"
          variant="elevated"
          :loading="isDeleting"
          :disabled="isDeleting"
          @click="deleteSelectedArmas"
        >
          <VIcon
            start
            icon="tabler-trash"
          />
          {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Modal para mostrar registros eliminados -->
  <VDialog
    v-model="isDeletedListVisible"
    max-width="900px"
    scrollable
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="closeDeletedListModal" />

    <!-- Dialog Content -->
    <VCard title="🗑️ Registros Eliminados">
      <VCardText>
        <div 
          v-if="isFetchingDeleted" 
          class="d-flex justify-center align-center pa-4"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="24"
          />
          <span class="ms-2">
            <VIcon 
              icon="tabler-database-search" 
              size="116" 
              class="me-1" 
            />
            Cargando registros eliminados...
          </span>
        </div>

        <div 
          v-else-if="deletedArmas.length === 0" 
          class="text-center pa-4"
        >
          <VIcon 
            icon="tabler-trash-off" 
            size="64" 
            class="text-grey-400 mb-2" 
          />
          <p class="text-h6 text-grey-600">
            <VIcon 
              icon="tabler-check-circle" 
              size="20" 
              class="me-2 text-success" 
            />
            No hay registros eliminados
          </p>
          <p class="text-body-2 text-grey-500 mt-2">
            Todos los registros están activos en el sistema.
          </p>
        </div>

        <div v-else>
          <VDataTable
            :items="deletedArmas"
            :headers="[
              { title: '#', key: 'id', width: '80px' },
              { title: 'Código', key: 'arma_cod' },
              { title: 'Descripción', key: 'arma_descripcion' },
              { title: 'Abreviatura', key: 'arma_abreviacion' },
              { title: 'Posición', key: 'arma_posicion', width: '100px' },
              { title: 'Acciones', key: 'actions', sortable: false, width: '120px' },
            ]"
            item-value="id"
            class="text-no-wrap"
            density="compact"
          >
            <!-- Renderiza la columna descripción -->
            <template #item.arma_descripcion="{ item }">
              <div class="d-flex align-center">
                <VIcon 
                  icon="tabler-trash" 
                  size="16" 
                  class="text-error me-2" 
                />
                <span class="text-decoration-line-through text-grey-600">
                  {{ item.arma_descripcion }}
                </span>
              </div>
            </template>

            <!-- Renderiza las acciones -->
            <template #item.actions="{ item }">
              <VBtn
                size="small"
                color="success"
                variant="outlined"
                :loading="isRestoringFromList"
                :disabled="isRestoringFromList"
                @click="restoreFromList(item)"
              >
                <VIcon 
                  icon="tabler-arrow-back-up" 
                  size="16" 
                />
                {{ isRestoringFromList ? 'Restaurando...' : 'Restaurar' }}
              </VBtn>
            </template>
          </VDataTable>
        </div>
      </VCardText>

      <VCardActions class="justify-end">
        <VBtn
          color="secondary"
          variant="outlined"
          @click="closeDeletedListModal"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Modal de Mensaje de Éxito -->
  <VDialog
    v-model="showSuccessModal"
    max-width="500px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-center pa-6 bg-success">
        <VIcon 
          icon="tabler-check-circle" 
          size="32" 
          class="me-3 text-white" 
        />
        <span class="text-h5 text-white">{{ successTitle }}</span>
      </VCardTitle>
      
      <VCardText class="text-center pa-6">
        <VIcon 
          icon="tabler-circle-check-filled" 
          size="164" 
          class="text-success mb-4" 
        />
        <p class="text-h6 mb-3">
          {{ successMessage }}
        </p>
        <p class="text-body-2 text-grey-600">
          La operación se completó exitosamente.
        </p>
      </VCardText>
      
      <VCardActions class="justify-center pa-4">
        <VBtn
          color="success"
          variant="elevated"
          @click="closeSuccessModal"
        >
          <VIcon icon="tabler-check" />
          Entendido
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Modal de Mensaje de Error -->
  <VDialog
    v-model="showErrorModal"
    max-width="600px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-center pa-6 bg-error">
        <VIcon 
          icon="tabler-alert-triangle" 
          size="32" 
          class="me-3 text-white" 
        />
        <span class="text-h5 text-white">{{ errorTitle }}</span>
      </VCardTitle>
      
      <VCardText class="text-center pa-6">
        <VIcon 
          icon="tabler-alert-circle-filled" 
          size="64" 
          class="text-error mb-4" 
        />
        <p class="text-h6 mb-3">
          {{ errorMessage }}
        </p>
        <p class="text-body-2 text-grey-600">
          Por favor, revisa los datos e intenta nuevamente.
        </p>
      </VCardText>
      
      <VCardActions class="justify-center pa-4">
        <VBtn
          color="error"
          variant="elevated"
          @click="closeErrorModal"
        >
          <VIcon icon="tabler-x" />
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Modal de Mensaje de Eliminación -->
  <VDialog
    v-model="showDeletedModal"
    max-width="600px"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center justify-center pa-6 bg-warning">
        <VIcon 
          icon="tabler-trash-x" 
          size="62" 
          class="me-3 text-white" 
        />
        <span class="text-h5 text-white">Registro Eliminado</span>
      </VCardTitle>
      
      <VCardText class="text-center pa-6">
        <VIcon 
          icon="tabler-alert-triangle-filled" 
          size="164" 
          class="text-warning mb-4" 
        />
        <p class="text-h6 mb-3">
          <VIcon 
            icon="tabler-info-circle" 
            size="20" 
            class="me-2" 
          />
          Arma marcada como eliminada
        </p>
        
        <div 
          v-if="deletedArma"
          class="pa-4 bg-grey-50 rounded mb-4"
        >
          <div class="text-h6 mb-2">
            <VIcon 
              icon="tabler-shield-x" 
              size="18" 
              class="me-2 text-error" 
            />
            {{ deletedArma?.arma_descripcion || 'Sin descripción' }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            <VIcon 
              icon="tabler-hash" 
              size="14" 
              class="me-1" 
            />
            <strong>Código:</strong> {{ deletedArma?.arma_cod || 'Sin código' }}<br>
            <VIcon 
              icon="tabler-text-size" 
              size="14" 
              class="me-1" 
            />
            <strong>Abreviatura:</strong> {{ deletedArma?.arma_abreviacion || 'Sin abreviatura' }}
          </div>
        </div>
        
        <p class="text-body-2 text-grey-600">
          El registro ha sido marcado como eliminado. Puedes restaurarlo usando el botón "Restaurar".
        </p>
      </VCardText>
      
      <VCardActions class="justify-center pa-4 gap-3">
        <VBtn
          color="success"
          variant="elevated"
          :loading="isRestoring"
          :disabled="isRestoring"
          @click="restoreArma"
        >
          <VIcon icon="tabler-arrow-back-up" />
          {{ isRestoring ? 'Restaurando...' : 'Restaurar Registro' }}
        </VBtn>
        <VBtn
          color="secondary"
          variant="outlined"
          :disabled="isRestoring"
          @click="closeDeletedModal"
        >
          <VIcon icon="tabler-x" />
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <!-- Modal de información para formato de importación -->
  <VDialog
    v-model="showImportFormatDialog"
    max-width="800"
    persistent
  >
    <VCard>
      <VCardTitle class="d-flex align-center gap-2">
        <VIcon
          icon="tabler-info-circle"
          color="info"
        />
        Formato de Archivo para Importación
      </VCardTitle>

      <VCardText>
        <VAlert
          type="info"
          variant="tonal"
          class="mb-4"
        >
          <strong>Información Importante:</strong> Solo se admiten archivos CSV actualmente. Los archivos Excel (.xlsx/.xls) requieren implementación adicional.
        </VAlert>

        <div class="mb-4">
          <h6 class="text-h6 mb-3">
            📋 Columnas Requeridas (en este orden exacto):
          </h6>
          <VChip
            v-for="column in ['Código', 'Descripción', 'Abreviatura', 'Posición', 'Estado']"
            :key="column"
            :color="['Código', 'Descripción'].includes(column) ? 'error' : 'primary'"
            variant="outlined"
            class="ma-1"
          >
            {{ column }}
            <VIcon
              v-if="['Código', 'Descripción'].includes(column)"
              icon="tabler-asterisk"
              size="12"
              class="ms-1"
            />
          </VChip>
          <div class="text-caption mt-2">
            <VIcon
              icon="tabler-asterisk"
              size="12"
              color="error"
            />
            Campos obligatorios
          </div>
        </div>

        <div class="mb-4">
          <h6 class="text-h6 mb-3">
            ⚙️ Especificaciones del Archivo:
          </h6>
          <VList density="compact">
            <VListItem>
              <VListItemTitle>
                <VIcon
                  icon="tabler-file-type-csv"
                  class="me-2"
                />
                Formato: CSV (Los valores se separan por un punto y coma ";")
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <VIcon
                  icon="tabler-separator-horizontal"
                  class="me-2"
                />
                Separador: ; (punto y coma)
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <VIcon
                  icon="tabler-file-text"
                  class="me-2"
                />
                Codificación: UTF-8
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <VIcon
                  icon="tabler-list-numbers"
                  class="me-2"
                />
                Primera fila: Encabezados (nombres de columnas)
              </VListItemTitle>
            </VListItem>
          </VList>
        </div>

        <div class="mb-4">
          <h6 class="text-h6 mb-3">
            📝 Ejemplo de Archivo CSV:
          </h6>
          <VCard
            color="grey-lighten-5"
            class="pa-3"
          >
            <pre
              class="text-body-2"
              style="font-family: monospace; white-space: pre-wrap;"
            >Código;Descripción;Abreviatura;Posición;Estado
001;Infanteria;237;1;Activo
002;Caballeria;19;2;Activo
003;Artillería;785;3;Inactivo</pre>
          </VCard>
        </div>

        <div class="mb-4">
          <h6 class="text-h6 mb-3">
            ⚠️ Reglas de Validación:
          </h6>
          <VList density="compact">
            <VListItem>
              <VListItemTitle>
                <VIcon
                  icon="tabler-check"
                  color="success"
                  class="me-2"
                />
                Los campos "Código" y "Descripción" son obligatorios
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <VIcon
                  icon="tabler-check"
                  color="success"
                  class="me-2"
                />
                El campo "Estado" por defecto será "Activo" si no se especifica
              </VListItemTitle>
            </VListItem>
            <VListItem>
              <VListItemTitle>
                <VIcon
                  icon="tabler-check"
                  color="success"
                  class="me-2"
                />
                Los registros con errores se omitirán, los válidos se importarán
              </VListItemTitle>
            </VListItem>
          </VList>
        </div>

        <VAlert
          type="success"
          variant="tonal"
        >
          <strong>💡 Consejo:</strong> Puede crear el archivo en Excel y guardarlo como "CSV (delimitado por punto y coma)" para obtener el formato correcto.
        </VAlert>
      </VCardText>

      <VCardActions class="justify-space-between">
        <VBtn
          color="success"
          variant="outlined"
          prepend-icon="tabler-download"
          @click="downloadExampleFile"
        >
          Descargar Archivo de Ejemplo
        </VBtn>
        
        <div class="d-flex gap-2">
          <VBtn
            color="grey"
            variant="outlined"
            @click="showImportFormatDialog = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            variant="elevated"
            @click="proceedWithFileSelection"
          >
            Continuar con Importación
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
#arma-list {
  .arma-list-actions {
    inline-size: 8rem;
  }

  .arma-list-filter {
    inline-size: 12rem;
  }
}

// Estilos para tabla móvil
.mobile-table {
  .v-data-table__wrapper {
    overflow-x: auto;
  }

  // Ocultar headers en móvil para usar cards
  @media (max-width: 600px) {
    .v-data-table-header th {
      display: none !important;

      &[data-key="data-table-select"],
      &[data-key="mobile-info"] {
        display: table-cell !important;
      }
    }

    .v-data-table__tr {
      display: block;
      border: none !important;

      .v-data-table__td {
        display: block;
        padding: 0 !important;
        border: none !important;

        &[data-key="mobile-info"] {
          inline-size: 100% !important;
        }

        &[data-key="data-table-select"] {
          position: absolute;
          z-index: 1;
          padding: 4px !important;
          border-radius: 50%;
          background: rgba(255, 255, 255, 90%);
          inset-block-start: 8px;
          inset-inline-start: 8px;
        }

        // Ocultar columnas específicas pero mantener mobile-info visible
        &[data-key="id"],
        &[data-key="codigo"],
        &[data-key="descripcion"],
        &[data-key="abreviatura"],
        &[data-key="posicion"],
        &[data-key="status"],
        &[data-key="actions"] {
          display: none !important;
        }
      }
    }
  }
}

// Mejoras generales para responsividad
@media (max-width: 960px) {
  .arma-list-actions {
    inline-size: auto !important;
    min-inline-size: 100px;
  }

  .arma-list-filter {
    inline-size: auto !important;
    min-inline-size: 120px;
  }
}

@media (max-width: 600px) {
  // Ajustar botones para móviles
  .v-btn {
    min-inline-size: auto !important;

    &.v-btn--block {
      margin-block-end: 8px;
    }
  }

  // Ajustar espaciado en móviles
  .pa-6 {
    padding: 1rem !important;
  }

  .pa-4 {
    padding: 0.75rem !important;
  }
}
</style>
