import { setupWorker } from 'msw/browser'

// Handlers
import { handlerAppBarSearch } from '@db/app-bar-search/index'
import { handlerAppsAcademy } from '@db/apps/academy/index'
import { handlerAppsCalendar } from '@db/apps/calendar/index'
import { handlerAppsChat } from '@db/apps/chat/index'
import { handlerAppsEcommerce } from '@db/apps/ecommerce/index'
import { handlerAppsEmail } from '@db/apps/email/index'
import { handlerAppsInvoice } from '@db/apps/invoice/index'
import { handlerAppsKanban } from '@db/apps/kanban/index'
import { handlerAppLogistics } from '@db/apps/logistics/index'
import { handlerAppsPermission } from '@db/apps/permission/index'
import { handlerAppsUsers } from '@db/apps/users/index'
import { handlerAuth } from '@db/auth/index'
import { handlerDashboard } from '@db/dashboard/index'
import { handlerPagesDatatable } from '@db/pages/datatable/index'
import { handlerPagesFaq } from '@db/pages/faq/index'
import { handlerPagesHelpCenter } from '@db/pages/help-center/index'
import { handlerPagesProfile } from '@db/pages/profile/index'

const worker = setupWorker(...handlerAppsEcommerce, ...handlerAppsAcademy, ...handlerAppsInvoice, ...handlerAppsUsers, ...handlerAppsEmail, ...handlerAppsCalendar, ...handlerAppsChat, ...handlerAppsPermission, ...handlerPagesHelpCenter, ...handlerPagesProfile, ...handlerPagesFaq, ...handlerPagesDatatable, ...handlerAppBarSearch, ...handlerAppLogistics, ...handlerAuth, ...handlerAppsKanban, ...handlerDashboard)
export default function () {
  const workerUrl = `${import.meta.env.BASE_URL ?? '/'}mockServiceWorker.js`

  worker.start({
    serviceWorker: {
      url: workerUrl,
    },
    onUnhandledRequest(request) {
      // Obtener la URL base de la API desde las variables de entorno
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
      const url = new URL(request.url)
      
      // ✅ NUEVO: No interceptar blob URLs (para PDFs y archivos locales)
      if (request.url.startsWith('blob:')) {
        console.log('MSW: Bypassing blob URL:', request.url)
        
        return
      }
      
      // ✅ NUEVO: No interceptar data URLs
      if (request.url.startsWith('data:')) {
        console.log('MSW: Bypassing data URL:', request.url)
        
        return
      }
      
      // Si la petición va a la API real, no interceptar
      if (apiBaseUrl && request.url.startsWith(apiBaseUrl)) {
        console.log('MSW: Bypassing API request to real server:', request.method, request.url)
        
        return
      }
      
      // Si la petición es a rutas de armas específicamente, no interceptar
      if (url.pathname.includes('/armas')) {
        console.log('MSW: Bypassing armas API request:', request.method, request.url)
        
        return
      }
      
      // Si la petición va a localhost:8000 (servidor Laravel común), no interceptar
      if (url.hostname === 'localhost' && (url.port === '8000' || url.port === '8080')) {
        console.log('MSW: Bypassing localhost API request:', request.method, request.url)
        
        return
      }
      
      // Para otras peticiones no manejadas, continuar normalmente sin interferir
      console.log('MSW: Allowing unhandled request to pass through:', request.method, request.url)
    },
  })
}
