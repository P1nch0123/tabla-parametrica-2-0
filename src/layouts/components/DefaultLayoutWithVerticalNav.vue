<script setup>
import navItems from '@/navigation/vertical'
import { themeConfig } from '@themeConfig'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'
import NavSearchBar from '@/layouts/components/NavSearchBar.vue'
import NavbarShortcuts from '@/layouts/components/NavbarShortcuts.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

// i18n
const { t } = useI18n()

// Función para traducir recursivamente los items de navegación
const translateNavItems = items => {
  return items.map(item => {
    const translatedItem = { ...item }
    
    // Traducir heading si existe
    if (item.heading && typeof item.heading === 'string') {
      translatedItem.heading = t(item.heading)
    }
    
    // Traducir title si existe
    if (item.title && typeof item.title === 'string') {
      translatedItem.title = t(item.title)
    }
    
    // Traducir children recursivamente si existen
    if (item.children && Array.isArray(item.children)) {
      translatedItem.children = translateNavItems(item.children)
    }
    
    return translatedItem
  })
}

// Computed reactivo para los items de navegación traducidos
const translatedNavItems = computed(() => translateNavItems(navItems))
</script>

<template>
  <VerticalNavLayout :nav-items="translatedNavItems">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>

        <NavSearchBar class="ms-lg-n3" />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <NavbarThemeSwitcher />
        <NavbarShortcuts />
        <NavBarNotifications class="me-1" />
        <UserProfile />
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer />
  </VerticalNavLayout>
</template>
