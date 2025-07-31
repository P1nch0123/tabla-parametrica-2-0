<script setup>
import { betweenValidator, requiredValidator } from '@/@core/utils/validators'

const props = defineProps({
  armaData: {
    type: Object,
    required: false,
    default: () => ({
      id: 0,
      armaCod: '',
      armaDescripcion: '',
      armaAbreviacion: '',
      armaPosicion: '',
    }),
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  mode: {
    type: String,
    default: 'create',
  },
})

const emit = defineEmits([
  'submit',
  'update:isDialogVisible',
])

// Switch
const Activo = 'Activo'
const Inactivo = 'Inactivo'
const switch1 = ref(Activo)

/*
const capitalizedLabel = label => {
  const convertLabelText = label.toString()
  return convertLabelText.charAt(0).toUpperCase() + convertLabelText.slice(1)
}
*/

const armaData = ref(structuredClone(toRaw(props.armaData)))

// Inicializar el switch con el estado actual del arma
watch(() => props.armaData, () => {
  armaData.value = structuredClone(toRaw(props.armaData))
  
  // Sincronizar el switch con el estado del arma
  switch1.value = props.armaData.armaEstado || Activo
}, { immediate: true })

// Watch adicional para asegurar la sincronización del estado
watch(() => props.isDialogVisible, newVal => {
  if (newVal) {
    // Cuando se abre el modal, sincronizar el estado
    switch1.value = props.armaData.armaEstado || Activo
  }
})

const onFormSubmit = () => {
  armaData.value.armaEstado = switch1.value

  emit('update:isDialogVisible', false)
  emit('submit', {
    data: armaData.value,
    mode: props.mode,
  })

  console.log('Arma data submitted:', armaData.value)
}

const onFormReset = () => {
  armaData.value = structuredClone(toRaw(props.armaData))
  emit('update:isDialogVisible', false)
}

const dialogModelValueUpdate = val => {
  emit('update:isDialogVisible', val)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 950"
    :model-value="props.isDialogVisible"
    persistent
    transition="dialog-transition"
    @update:model-value="dialogModelValueUpdate"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="dialogModelValueUpdate(false)" />

    <VCard class="elevation-12 rounded-xl">
      <!-- Header limpio y elegante -->
      <VCardTitle class="pa-6 border-b">
        <div class="d-flex align-center gap-4">
          <VAvatar
            :color="props.mode === 'edit' ? 'primary' : 'success'"
            variant="tonal"
            size="56"
          >
            <VIcon
              :icon="props.mode === 'edit' ? 'tabler-edit' : 'tabler-plus'"
              size="28"
            />
          </VAvatar>
          
          <div>
            <h4 class="text-h4 mb-1 text-high-emphasis">
              {{ props.mode === 'edit' ? 'Editar Información del Arma' : 'Registrar Nueva Arma' }}
            </h4>
            <p class="text-body-1 text-medium-emphasis mb-0">
              {{ props.mode === 'edit' ? 'Modifica los detalles del arma seleccionada' : 'Complete la información del nuevo arma' }}
            </p>
          </div>
        </div>
      </VCardTitle>

      <VCardText class="pa-8">
        <!-- 👉 Form -->
        <VForm
          class="mt-2"
          @submit.prevent="onFormSubmit"
        >
          <VRow class="mb-4">
            <!-- 👉 Código -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard
                class="pa-4 mb-4"
                variant="tonal"
                color="primary"
              >
                <div class="d-flex align-center gap-3 mb-3">
                  <VAvatar
                    color="primary"
                    variant="tonal"
                    size="32"
                  >
                    <VIcon
                      icon="tabler-barcode"
                      size="18"
                    />
                  </VAvatar>
                  <span class="text-subtitle-1 font-weight-medium">Identificación</span>
                </div>
                
                <AppTextField
                  v-model="armaData.armaCod"
                  label="Código del Arma"
                  placeholder="Ej: FUS001"
                  maxlength="4"
                  prepend-inner-icon="tabler-hash"
                  variant="filled"
                  color="primary"
                  class="mb-4"
                />

                <AppTextField
                  v-model="armaData.armaAbreviacion"
                  label="Abreviación"
                  placeholder="Ej: AK47"
                  prepend-inner-icon="tabler-text-size"
                  variant="filled"
                  color="primary"
                />
              </VCard>
            </VCol>

            <!-- 👉 Descripción y Posición -->
            <VCol
              cols="12"
              md="6"
            >
              <VCard
                class="pa-4 mb-4"
                variant="tonal"
                color="secondary"
              >
                <div class="d-flex align-center gap-3 mb-3">
                  <VAvatar
                    color="secondary"
                    variant="tonal"
                    size="32"
                  >
                    <VIcon
                      icon="tabler-file-description"
                      size="18"
                    />
                  </VAvatar>
                  <span class="text-subtitle-1 font-weight-medium">Detalles</span>
                </div>
                
                <AppTextField
                  v-model="armaData.armaDescripcion"
                  label="Descripción"
                  placeholder="Ej: Fusil de Asalto AK-47"
                  prepend-inner-icon="tabler-file-text"
                  variant="filled"
                  color="secondary"
                  class="mb-4"
                />

                <AppTextField
                  v-model="armaData.armaPosicion"
                  label="Posición"
                  placeholder="Número del 1 al 9999"
                  type="number"
                  maxlength="4"
                  prepend-inner-icon="tabler-list-numbers"
                  variant="filled"
                  color="secondary"
                  :rules="[requiredValidator, betweenValidator(armaData.armaPosicion, 0, 9999)]"
                />
              </VCard>
            </VCol>

            <!-- 👉 Estado -->
            <VCol cols="12">
              <VCard
                class="pa-4"
                variant="tonal"
                color="success"
              >
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center gap-3">
                    <VAvatar
                      color="success"
                      variant="tonal"
                      size="32"
                    >
                      <VIcon
                        icon="tabler-toggle-left"
                        size="18"
                      />
                    </VAvatar>
                    <div>
                      <span class="text-subtitle-1 font-weight-medium">Estado del Arma</span>
                      <p class="text-caption text-medium-emphasis mb-0">
                        {{ switch1 === Activo ? 'El arma está disponible para uso' : 'El arma está fuera de servicio' }}
                      </p>
                    </div>
                  </div>
                  
                  <VSwitch
                    v-model="switch1"
                    :true-value="Activo"
                    :false-value="Inactivo"
                    :label="switch1"
                    color="success"
                    inset
                    hide-details
                  />
                </div>
              </VCard>
            </VCol>

            <!-- 👉 Submit and Cancel -->
            <VCol
              cols="12"
              class="d-flex flex-wrap justify-center gap-4 pt-6"
            >
              <VBtn
                type="submit"
                :color="props.mode === 'edit' ? 'primary' : 'success'"
                variant="elevated"
                size="large"
                :prepend-icon="props.mode === 'edit' ? 'tabler-device-floppy' : 'tabler-plus'"
                class="px-8"
              >
                {{ props.mode === 'edit' ? 'Actualizar' : 'Crear Arma' }}
              </VBtn>

              <VBtn
                color="secondary"
                variant="tonal"
                size="large"
                prepend-icon="tabler-x"
                class="px-8"
                @click="onFormReset"
              >
                Cancelar
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
