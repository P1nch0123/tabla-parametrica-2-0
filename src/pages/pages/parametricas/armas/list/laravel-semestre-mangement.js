'use strict'

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function (e) {
  // Variables de colores para la tabla (usadas en la personalización de exportaciones)
  let borderColor, bodyBg, headingColor
  borderColor = config.colors.borderColor
  bodyBg = config.colors.bodyBg
  headingColor = config.colors.headingColor

  // Declaración de variables principales
  const dt_semestre_table = document.querySelector('.datatables-semestres'),
    offCanvasForm = document.getElementById('offcanvasAddSemestre')

  // Inicialización de DataTable si existe la tabla de semestres
  if (dt_semestre_table) {
    const dt_semestre = new DataTable(dt_semestre_table, {
      processing: true,
      serverSide: true,
      ajax: {
        url: baseUrl + 'semestres', // Ruta resource index para DataTables
        dataSrc: function (json) {
          if (typeof json.recordsTotal !== 'number') json.recordsTotal = 0
          if (typeof json.recordsFiltered !== 'number') json.recordsFiltered = 0
          json.data = Array.isArray(json.data) ? json.data : []
          
          return json.data
        },
      },
      columns: [
        {
          className: 'control',
          orderable: false,
          searchable: false,
          width: '30px',
          defaultContent: '',
        },
        {
          data: null,
          title: '<input type="checkbox" class="form-check-input" id="select-all-semestres">',
          orderable: false,
          searchable: false,
          width: '50px',
          render: function (data, type, full) {
            return `<input type="checkbox" class="form-check-input row-checkbox" value="${full.id}">`
          },
        },
        { data: 'id' },
        { data: 'nombre' },
        { data: 'carrera_nombre' },

        // Elimina esta línea
        // { data: 'action', orderable: false, searchable: false }
      ],
      columnDefs: [
        {
          targets: 1,
          title: 'ID',
          searchable: false,
          orderable: true,
          className: 'text-center',
          width: '50px',

          render: function (data) {
            return `<span>${data}</span>`
          },
        },
        {
          targets: 2,

          render: function (data) {
            return `<span class="fw-medium">${data}</span>`
          },
        },
        {
          targets: 3,
          render: function (data) {
            return `<span>${data || ''}</span>`
          },
        },
        {
          targets: 5,
          title: 'Acciones',
          searchable: false,
          orderable: false,
          render: function (data, type, full) {
            return (
              '<div class="d-flex align-items-center gap-4">' +
              `<button class="btn btn-sm btn-icon edit-record" data-id="${full['id']}" data-bs-toggle="offcanvas" data-bs-target="#offcanvasAddSemestre"><i class="icon-base ti tabler-edit icon-22px"></i></button>` +
              `<button class="btn btn-sm btn-icon delete-record" data-id="${full['id']}"><i class="icon-base ti tabler-trash icon-22px"></i></button>` +
              '</div>'
            )
          },
        },
      ],
      order: [[2, 'desc']],

      layout: {
        topStart: {
          rowClass: 'row m-3 my-0 justify-content-between',
          features: [
            {
              pageLength: {
                menu: [10, 20, 50, 70, 100],
                text: '_MENU_',
              },
            },
          ],
        },
        topEnd: {
          features: [
            {
              search: {
                placeholder: 'Buscar registros',
                text: '_INPUT_',
              },
            },
            {
              buttons: [
                {
                  extend: 'collection',
                  className: 'btn btn-label-secondary dropdown-toggle',
                  text: '<i class="icon-base ti tabler-upload me-2 icon-sm"></i>Exportar',
                  buttons: [
                    {
                      extend: 'print',
                      title: 'Semestres',
                      text: '<i class="icon-base ti tabler-printer me-2"></i>Imprimir',
                      className: 'dropdown-item',
                      exportOptions: {
                        columns: [2, 3, 4], // Solo imprime ID, Nombre y Carrera
                      },
                      customize: function (win) {
                        // Referencia al documento de la ventana de impresión
                        var doc = win.document

                        // Agregar estilos CSS
                        $(doc.head).append(`
                      <style>

                        .header {
                          text-align: center;
                          margin-bottom: 20px;
                          border-bottom: 2px solid #4F4F4F;
                          padding-bottom: 10px;
                        }
                      table {
                          width: 100%;
                          border-collapse: collapse;
                          border: 2px solid #4F4F4F;
                          margin-bottom: 20px;
                        }
                        table thead tr:first-child th {
                          border-top: 2px solid #4F4F4F;
                        }

                        table tr:last-child td {
                          border-bottom: 2px solid #4F4F4F;
                        }

                        table tr td:first-child,
                        table tr th:first-child {
                          border-left: 2px solid #4F4F4F;
                        }

                        table tr td:last-child,
                        table tr th:last-child {
                          border-right: 2px solid #4F4F4F;
                        }
                        th, td {
                          border: 1px solid #ddd;
                          padding: 12px 8px;
                          text-align: left;
                        }

                        th {
                          background-color: #4F4F4F !important;
                          color: white !important;
                          font-weight: bold;
                          border: 1px solid #4F4F4F;
                        }
                        tr:nth-child(even) {
                          background-color: #f9f9f9;
                        }

                        tr:hover {
                          background-color: #f5f5f5;
                        }
                      </style>
                    `)

                        // Agregar encabezado
                        $(doc.body).prepend(`
                          <div class="header">
                            <h5>ESCUELA MILITAR DE INGENIERÍA
                            </br>
                            MCAL. ANTONIO JOSÉ DE SUCRE
                            </br>
                            BOLIVIA</h5>
                          </div>
                          <div class="date-time">
                            <div>Fecha: ${new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}</div>
                            <div>Hora: ${new Date().toLocaleTimeString('es-MX')}</div>
                          </div>
                        `)

                        // Agregar pie de página
                        $(doc.body).append(`
                        <div class="footer">
                          <div style="float: left">Generado por el Sistema SPRODA V2.0</div>
                          <div style="float: right">Página 1</div>
                          <div style="clear: both"></div>
                        </div>
                      `)

                        // Ajustar ancho de columnas
                        $(doc).find('table').addClass('compact').css('font-size', '14px').css('margin-bottom', '30px')

                        $(doc)
                          .find('table th')
                          .each(function (i) {
                            $(this).css('width', i === 0 ? '20%' : '40%')
                          })
                      },
                    },
                    {
                      extend: 'csv',
                      title: 'Semestres',
                      text: '<i class="icon-base ti tabler-file-text me-2"></i>CSV',
                      className: 'dropdown-item',
                      exportOptions: { columns: [2, 3, 4] },
                    },
                    {
                      extend: 'excel',
                      title: 'Reporte de Semestres',
                      text: '<i class="icon-base ti tabler-file-spreadsheet me-2"></i>Excel',
                      className: 'dropdown-item',
                      exportOptions: { columns: [2, 3, 4] },
                    },
                    {
                      extend: 'pdf',
                      title: 'Reporte de Semestres',
                      text: '<i class="icon-base ti tabler-file-code-2 me-2"></i>PDF',
                      className: 'dropdown-item',
                      orientation: 'portrait',
                      pageSize: 'LETTER',
                      exportOptions: {
                        columns: [2, 3, 4], // Solo exporta ID, Nombre y Carrera
                      },
                      customize: function (doc) {
                        // Configuración de estilos básicos
                        doc.defaultStyle.fontSize = 10
                        doc.styles.tableHeader.fontSize = 12
                        doc.styles.title.fontSize = 14
                        doc.styles.tableHeader.fillColor = '#4F4F4F'
                        doc.styles.tableHeader.color = '#FFFFFF'

                        // Encabezado con logo y título
                        doc.content.splice(0, 1, {
                          margin: [0, 0, 0, 15],
                          table: {
                            widths: ['*'],
                            body: [
                              [
                                {
                                  text: [
                                    { text: 'ESCUELA MILITAR DE INGENIERÍA\n', style: 'headerTitle' },
                                    { text: 'MCAL. ANTONIO JOSÉ DE SUCRE\n', style: 'headerTitle' },
                                    { text: 'BOLIVIA', style: 'headerTitle' },
                                  ],
                                  alignment: 'center',
                                },
                              ],
                            ],
                          },
                          layout: 'noBorders',
                        })

                        // Subtítulo del reporte
                        doc.content.splice(1, 0, {
                          margin: [0, 0, 0, 10],
                          text: 'REPORTE DE SEMESTRES',
                          style: 'reportTitle',
                          alignment: 'center',
                        })

                        // Información adicional
                        doc.content.splice(2, 0, {
                          margin: [0, 0, 0, 10],
                          columns: [
                            {
                              text: `Fecha: ${new Date().toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}`,
                              alignment: 'left',
                              fontSize: 10,
                            },
                            {
                              text: `Hora: ${new Date().toLocaleTimeString('es-MX')}`,
                              alignment: 'right',
                              fontSize: 10,
                            },
                          ],
                        })

                        // Estilos personalizados
                        doc.styles = {
                          ...doc.styles,
                          headerTitle: {
                            fontSize: 16,
                            bold: true,
                            color: '#1D1D1D',
                          },
                          headerSubtitle: {
                            fontSize: 14,
                            bold: true,
                            color: '#4F4F4F',
                          },
                          reportTitle: {
                            fontSize: 14,
                            bold: true,
                            color: '#1D1D1D',
                          },
                        }

                        // Ajustes de tabla
                        doc.content[3].table.widths = ['20%', '40%', '40%'] // Ajusta el ancho de las columnas

                        // Pie de página
                        doc.footer = function (currentPage, pageCount) {
                          return {
                            columns: [
                              {
                                text: 'Generado por el Sistema SPRODA V2.0',
                                alignment: 'left',
                                fontSize: 8,
                                margin: [40, 0],
                              },
                              {
                                text: `Página ${currentPage.toString()} de ${pageCount}`,
                                alignment: 'right',
                                fontSize: 8,
                                margin: [0, 0, 40, 0],
                              },
                            ],
                            margin: [40, 10],
                          }
                        }

                        // Bordes y líneas
                        var objLayout = {
                          hLineWidth: function (i) {
                            return i === 0 || i === doc.content[3].table.body.length ? 2 : 1
                          },
                          vLineWidth: function (i) {
                            return 1
                          },
                          hLineColor: function (i) {
                            return i === 0 || i === doc.content[3].table.body.length ? '#4F4F4F' : '#AAAAAA'
                          },
                          vLineColor: function (i) {
                            return '#AAAAAA'
                          },
                          paddingLeft: function (i) {
                            return 4
                          },
                          paddingRight: function (i) {
                            return 4
                          },
                          paddingTop: function (i) {
                            return 4
                          },
                          paddingBottom: function (i) {
                            return 4
                          },
                        }
                        doc.content[3].layout = objLayout
                      },
                    },
                    {
                      extend: 'copy',
                      title: 'Semestres',
                      text: '<i class="icon-base ti tabler-copy me-2"></i>Copiar',
                      className: 'dropdown-item',
                      exportOptions: { columns: [1, 2, 3] },
                    },
                  ],
                },
              ],
            },
          ],
        },
        bottomStart: {
          rowClass: 'row mx-3 justify-content-between',
          features: [
            {
              info: {
                text: 'Mostrando _START_ a _END_ de _TOTAL_ registros',
              },
            },
          ],
        },
        bottomEnd: 'paging',
      },
      displayLength: 10, // Número de registros por página
      language: {
        paginate: {
          first: '<i class="icon-base ti tabler-chevrons-left scaleX-n1-rtl icon-18px"></i>',
          last: '<i class="icon-base ti tabler-chevrons-right scaleX-n1-rtl icon-18px"></i>',
          next: '<i class="icon-base ti tabler-chevron-right scaleX-n1-rtl icon-18px"></i>',
          previous: '<i class="icon-base ti tabler-chevron-left scaleX-n1-rtl icon-18px"></i>',
        },
      },

      // Configuración para responsive
      responsive: {
        details: {
          type: 'column',
          target: 0,
          renderer: function (api, rowIdx, columns) {
            // Filtramos las columnas que queremos mostrar (excluimos control, checkbox y acciones)
            const data = columns
              .filter(col => {
                // Solo mostramos columnas que:
                // 1. No sean la columna de control (índice 0)
                // 2. No sean la columna de checkbox (índice 1)
                // 3. No sean la columna de acciones (último índice)
                // 4. Estén ocultas en responsive
                return ![0, 1].includes(col.columnIndex) && col.columnIndex !== columns.length - 1 && col.hidden
              })
              .map(col => {
                return `<tr>
            <td class="fw-bold" style="width: 30%">${col.title}:</td>
            <td>${col.data}</td>
          </tr>`
              })
              .join('')

            return data
              ? `<table class="table">
          <tbody>${data}</tbody>
        </table>`
              : false
          },
        },
      },
    })

    // Función para actualizar la visibilidad del botón eliminar
    function updateDeleteButtonVisibility() {
      const checkedBoxes = document.querySelectorAll('.row-checkbox:checked').length
      const deleteButton = document.getElementById('delete-selected-semestres')
      if (deleteButton) {
        deleteButton.style.display = checkedBoxes > 0 ? 'inline-flex' : 'none'
      }
    }

    // Manejar selección múltiple
    document.getElementById('select-all-semestres').addEventListener('change', function () {
      const isChecked = this.checked
      const checkboxes = document.getElementsByClassName('row-checkbox')

      Array.from(checkboxes).forEach(checkbox => {
        checkbox.checked = isChecked
      })
      updateDeleteButtonVisibility()
    })

    // Actualizar checkbox principal cuando se seleccionen individualmente
    dt_semestre_table.addEventListener('change', function (e) {
      if (e.target.classList.contains('row-checkbox')) {
        const totalCheckboxes = document.getElementsByClassName('row-checkbox').length
        const checkedCheckboxes = document.getElementsByClassName('row-checkbox checked').length

        document.getElementById('select-all-semestres').checked = totalCheckboxes === checkedCheckboxes
        updateDeleteButtonVisibility()
      }
    })

    // Eliminar seleccionados
    document.getElementById('delete-selected-semestres').addEventListener('click', function () {
      const ids = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.value)
      if (ids.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: '¡Atención!',
          text: 'Selecciona al menos un semestre para eliminar.',
          customClass: { confirmButton: 'btn btn-warning' },
        })
        
        return
      }

      Swal.fire({
        title: '¿Estás seguro?',
        text: `Se eliminarán ${ids.length} semestres.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar!',
        customClass: {
          confirmButton: 'btn btn-danger me-3',
          cancelButton: 'btn btn-label-secondary',
        },
        buttonsStyling: false,
      }).then(function (result) {
        if (result.value) {
          fetch(`${baseUrl}semestres/bulk-delete`, {
            method: 'POST',
            headers: {
              'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ids }),
          })
            .then(response => response.json())
            .then(data => {
              Swal.fire({
                icon: 'success',
                title: '¡Eliminados!',
                text: data.message || 'Semestres eliminados correctamente.',
                customClass: { confirmButton: 'btn btn-success' },
              })
              if (dt_semestre && typeof dt_semestre.draw === 'function') {
                dt_semestre.draw()
              }
            })
        }
      })
    })

    // Evento para eliminar semestre
    document.addEventListener('click', function (e) {
      if (e.target.closest('.delete-record')) {
        const deleteBtn = e.target.closest('.delete-record')
        const semestre_id = deleteBtn.dataset.id
        const dtrModal = document.querySelector('.dtr-bs-modal.show')
        if (dtrModal) {
          const bsModal = bootstrap.Modal.getInstance(dtrModal)

          bsModal.hide()
        }
        Swal.fire({
          title: '¿Estás seguro?',
          text: '¡No podrás revertir esto!',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, eliminar!',
          customClass: {
            confirmButton: 'btn btn-primary me-3',
            cancelButton: 'btn btn-label-secondary',
          },
          buttonsStyling: false,
        }).then(function (result) {
          if (result.value) {
            fetch(`${baseUrl}semestres/${semestre_id}`, {
              method: 'DELETE',
              headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                'Content-Type': 'application/json',
              },
            })
              .then(response => {
                if (response.ok) {
                  dt_semestre.draw()
                  Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El semestre ha sido eliminado!',
                    customClass: {
                      confirmButton: 'btn btn-success',
                    },
                  })
                } else {
                  throw new Error('Delete failed')
                }
              })
              .catch(error => {
                console.log(error)
              })
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            Swal.fire({
              title: 'Cancelado',
              text: 'El semestre no fue eliminado!',
              icon: 'error',
              customClass: {
                confirmButton: 'btn btn-success',
              },
            })
          }
        })
      }
    })

    // ...existing code...

    const importForm = document.getElementById('importSemestreForm')
    if (importForm) {
      importForm.addEventListener('submit', function (e) {
        e.preventDefault()

        const formData = new FormData(importForm)

        fetch(importForm.action, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
          },
          body: formData,
        })
          .then(async response => {
            let data
            try {
              data = await response.json()
            } catch (e) {
              // Si no es JSON, muestra error genérico
              throw { message: 'Error inesperado en el servidor.' }
            }
            if (!response.ok) {
              throw data
            }
            
            return data
          })
          .then(data => {
            Swal.fire({
              icon: 'success',
              title: '¡Importación exitosa!',
              text: data.message,
              customClass: { confirmButton: 'btn btn-success' },
            })
            if (dt_semestre && typeof dt_semestre.draw === 'function') {
              dt_semestre.draw()
            }
            importForm.reset()
          })
          .catch(error => {
            Swal.fire({
              icon: 'error',
              title: '¡Error!',
              text: error.message || 'Error al importar el archivo.',
              customClass: { confirmButton: 'btn btn-danger' },
            })
          })
      })
    }

    // Evento para editar semestre (carga datos en el formulario lateral)
    document.addEventListener('click', function (e) {
      if (e.target.closest('.edit-record')) {
        const editBtn = e.target.closest('.edit-record')
        const semestre_id = editBtn.dataset.id
        const dtrModal = document.querySelector('.dtr-bs-modal.show')
        if (dtrModal) {
          const bsModal = bootstrap.Modal.getInstance(dtrModal)

          bsModal.hide()
        }
        document.getElementById('offcanvasAddSemestreLabel').innerHTML = 'Editar Semestre'
        fetch(`${baseUrl}semestres/${semestre_id}/edit`)
          .then(response => response.json())
          .then(data => {
            document.getElementById('semestre_id').value = data.id
            document.getElementById('add-semestre-nombre').value = data.nombre
            document.getElementById('add-semestre-carrera').value = data.carrera_id
          })
      }
    })

    // Evento para limpiar formulario y cambiar título al agregar
    const addNewBtn = document.querySelector('.add-new')
    if (addNewBtn) {
      addNewBtn.addEventListener('click', function () {
        document.getElementById('semestre_id').value = ''
        document.getElementById('offcanvasAddSemestreLabel').innerHTML = 'Nuevo registro'
      })
    }
  }

  // Validación y envío del formulario de semestre
  const addNewSemestreForm = document.getElementById('addNewSemestreForm')
  if (addNewSemestreForm) {
    const fv = FormValidation.formValidation(addNewSemestreForm, {
      fields: {
        nombre: {
          validators: {
            notEmpty: { message: 'Por favor ingresa el nombre del semestre' },
          },
        },
        carrera_id: {
          validators: {
            notEmpty: { message: 'Por favor selecciona una semestre' },
          },
        },
      },
      plugins: {
        trigger: new FormValidation.plugins.Trigger(),
        bootstrap5: new FormValidation.plugins.Bootstrap5({
          eleValidClass: '',
          rowSelector: function () {
            return '.mb-6'
          },
        }),
        submitButton: new FormValidation.plugins.SubmitButton(),
        autoFocus: new FormValidation.plugins.AutoFocus(),
      },
    }).on('core.form.valid', function () {
      // Envía el formulario por AJAX al backend
      const formData = new FormData(addNewSemestreForm)
      const formDataObj = {}

      formData.forEach((value, key) => {
        formDataObj[key] = value
      })

      const searchParams = new URLSearchParams()
      for (const [key, value] of Object.entries(formDataObj)) {
        searchParams.append(key, value)
      }
      fetch(`${baseUrl}semestres`, {
        method: 'POST',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: searchParams.toString(),
      })
        .then(response => {
          if (!response.ok) throw new Error('La respuesta de la red no fue correcta')
          
          return response.text()
        })
        .then(status => {
          dt_semestre_table && new DataTable(dt_semestre_table).draw()

          const offcanvasInstance = bootstrap.Offcanvas.getInstance(offCanvasForm)

          offcanvasInstance && offcanvasInstance.hide()
          Swal.fire({
            icon: 'success',
            title: `¡${status} exitosamente!`,
            text: `Semestre ${status} correctamente.`,
            customClass: { confirmButton: 'btn btn-success' },
          })
        })
        .catch(err => {
          const offcanvasInstance = bootstrap.Offcanvas.getInstance(offCanvasForm)

          offcanvasInstance && offcanvasInstance.hide()
          Swal.fire({
            title: '¡Entrada duplicada!',
            text: 'El semestre ya existe para la carrera seleccionada.',
            icon: 'error',
            customClass: { confirmButton: 'btn btn-success' },
          })
        })
    })

    // Limpia el formulario al cerrar el offcanvas
    offCanvasForm.addEventListener('hidden.bs.offcanvas', function () {
      fv.resetForm(true)
    })
    updateDeleteButtonVisibility()
  }
})
