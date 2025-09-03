import { createRouter, createWebHistory } from 'vue-router'
import { userResource } from '@/stores/user'
import { sessionStore } from '@/stores/session'
import { viewsStore } from '@/stores/views'

const routes = [
  {
    path: '/',
    name: 'Home',
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: () => import('@/pages/MobileNotification.vue'),
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/pages/Dashboard.vue'),
  },
  {
    alias: '/leads',
    path: '/leads/view/:viewType?',
    name: 'Leads',
    component: () => import('@/pages/Leads.vue'),
  },
  {
    path: '/leads/:leadId',
    name: 'Lead',
    component: () => import(`@/pages/${handleMobileView('Lead')}.vue`),
    props: true,
  },
  {
    alias: '/deals',
    path: '/deals/view/:viewType?',
    name: 'Deals',
    component: () => import('@/pages/Deals.vue'),
  },
  {
    path: '/deals/:dealId',
    name: 'Deal',
    component: () => import(`@/pages/${handleMobileView('Deal')}.vue`),
    props: true,
  },
  {
    alias: '/notes',
    path: '/notes/view/:viewType?',
    name: 'Notes',
    component: () => import('@/pages/Notes.vue'),
  },
  {
    alias: '/tasks',
    path: '/tasks/view/:viewType?',
    name: 'Tasks',
    component: () => import('@/pages/Tasks.vue'),
  },
  {
    alias: '/contacts',
    path: '/contacts/view/:viewType?',
    name: 'Contacts',
    component: () => import('@/pages/Contacts.vue'),
  },
  {
    path: '/contacts/:contactId',
    name: 'Contact',
    component: () => import(`@/pages/${handleMobileView('Contact')}.vue`),
    props: true,
  },
  {
    alias: '/organizations',
    path: '/organizations/view/:viewType?',
    name: 'Organizations',
    component: () => import('@/pages/Organizations.vue'),
  },
  {
    path: '/organizations/:organizationId',
    name: 'Organization',
    component: () => import(`@/pages/${handleMobileView('Organization')}.vue`),
    props: true,
  },
  {
    alias: '/call-logs',
    path: '/call-logs/view/:viewType?',
    name: 'Call Logs',
    component: () => import('@/pages/CallLogs.vue'),
  },
  // Yorecare Enquiry Routes
  {
    alias: '/yorecare-logs',
    path: '/yorecare-logs/view/:viewType?',
    name: 'Yorecare Logs',
    component: () => import('@/pages/YorecareLogs.vue'),
  },
  {
    path: '/yorecare-logs/:yorecareLogId',
    name: 'Yorecare Log',
    component: () => import(`@/pages/${handleMobileView('YorecareLog')}.vue`),
    props: true,
  },
  {
    alias: '/yorecare-enquiries',
    path: '/yorecare-enquiries/view/:viewType?',
    name: 'Yorecare Enquiries',
    component: () => import('@/pages/YorecareEnquiries.vue'),
  },
  {
    path: '/yorecare-enquiries/:yorecareEnquiryId',
    name: 'Yorecare Enquiry',
    component: () => import(`@/pages/${handleMobileView('YorecareEnquiry')}.vue`),
    props: true,
  },
  {
    alias: '/medicine-orders',
    path: '/medicine-orders/view/:viewType?',
    name: 'Medicine Orders',
    component: () => import('@/pages/MedicineOrders.vue'),
  },
  {
    path: '/medicine-orders/:medicineOrderId',
    name: 'Medicine Order',
    component: () => import(`@/pages/${handleMobileView('MedicineOrder')}.vue`),
    props: true,
  },
  {
    alias: '/lab-tests',
    path: '/lab-tests/view/:viewType?',
    name: 'Lab Tests',
    component: () => import('@/pages/LabTests.vue'),
  },
  {
    path: '/lab-tests/:labTestId',
    name: 'Lab Test',
    component: () => import(`@/pages/${handleMobileView('LabTest')}.vue`),
    props: true,
  },
  {
    alias: '/contact-expert-requests',
    path: '/contact-expert-requests/view/:viewType?',
    name: 'Contact Expert Requests',
    component: () => import('@/pages/ContactExpertRequests.vue'),
  },
  {
    path: '/contact-expert-requests/:contactExpertRequestId',
    name: 'Contact Expert Request',
    component: () => import(`@/pages/${handleMobileView('ContactExpertRequest')}.vue`),
    props: true,
  },
  {
    path: '/welcome',
    name: 'Welcome',
    component: () => import('@/pages/Welcome.vue'),
  },
  {
    path: '/:invalidpath',
    name: 'Invalid Page',
    component: () => import('@/pages/InvalidPage.vue'),
  },
]

const handleMobileView = (componentName) => {
  return window.innerWidth < 768 ? `Mobile${componentName}` : componentName
}

let router = createRouter({
  history: createWebHistory('/crm'),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const { isLoggedIn } = sessionStore()

  isLoggedIn && (await userResource.promise)

  if (to.name === 'Home' && isLoggedIn) {
    const { views, getDefaultView } = viewsStore()
    await views.promise

    let defaultView = getDefaultView()
    if (!defaultView) {
      next({ name: 'Leads' })
      return
    }

    let { route_name, type, name, is_standard } = defaultView
    route_name = route_name || 'Leads'

    if (name && !is_standard) {
      next({ name: route_name, params: { viewType: type }, query: { view: name } })
    } else {
      next({ name: route_name, params: { viewType: type } })
    }
  } else if (!isLoggedIn) {
    window.location.href = '/login?redirect-to=/crm'
  } else if (to.matched.length === 0) {
    next({ name: 'Invalid Page' })
  } else if (['Deal', 'Lead'].includes(to.name) && !to.hash) {
    let storageKey = to.name === 'Deal' ? 'lastDealTab' : 'lastLeadTab'
    const activeTab = localStorage.getItem(storageKey) || 'activity'
    const hash = '#' + activeTab
    next({ ...to, hash })
  } else {
    next()
  }
})

export default router