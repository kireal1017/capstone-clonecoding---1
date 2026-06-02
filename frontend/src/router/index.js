import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../views/Home.vue'),
  },
  {
    path: '/ui-preview',
    component: () => import('../views/UiPreview.vue'),
  },
  {
    path: '/contractor',
    component: () => import('../views/ContractorHome.vue'),
  },
  // /new MUST be declared before /:id so it is not shadowed by the param route
  {
    path: '/contractor/inspections/new',
    component: () => import('../views/NewInspection.vue'),
  },
  {
    path: '/contractor/inspections/:id',
    component: () => import('../views/InspectionDetail.vue'),
  },
  {
    path: '/owner/reports',
    component: () => import('../views/reports/ReportList.vue'),
  },
  {
    path: '/owner/reports/:id',
    component: () => import('../views/reports/ReportDetail.vue'),
  },
  {
    path: '/tenant/reports',
    component: () => import('../views/reports/ReportList.vue'),
  },
  {
    path: '/tenant/reports/:id',
    component: () => import('../views/reports/ReportDetail.vue'),
  },
  {
    path: '/owner/compare',
    component: () => import('../views/reports/CompareView.vue'),
  },
  {
    path: '/reports/:id/print',
    component: () => import('../views/reports/PrintView.vue'),
  },
  {
    path: '/share/:token',
    component: () => import('../views/ShareView.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    component: () => import('../views/NotFound.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
