import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) return { el: to.hash, top: 90, behavior: 'smooth' }
    return savedPosition || { top: 0 }
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: Login,
      meta: { guestOnly: true },
    },

    {
      path: '/home',
      alias: '/',
      name: 'home',
      component: () => import('@/views/Landing.vue'),
      meta: {},
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/resumes',
      name: 'resumes',
      component: () => import('@/views/ResumeList.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/resumes/:id',
      name: 'resume-editor',
      component: () => import('@/views/ResumeEditor.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/Home.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/analysis',
      name: 'analysis',
      component: () => import('@/views/JobAnalysis.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/analysis/:id',
      name: 'analysis-report',
      component: () => import('@/views/AnalysisReport.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/exports',
      name: 'exports',
      component: () => import('@/views/ExportCenter.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/resumes/:id/print',
      name: 'resume-print',
      component: () => import('@/views/ResumePrint.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/views/Profile.vue'),
      meta: { requiresAuth: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/home' },
  ],
})

let sessionCheck
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.token && !sessionCheck) sessionCheck = auth.restoreSession()
  if (sessionCheck) await sessionCheck
  if (to.meta.requiresAuth && !auth.isAuthenticated)
    return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'home' }
  return true
})

export default router
