import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
      meta: { guestOnly: true },
    },

    {
      path: '/home',
      name: 'home',
      component: () => import('@/views/Landing.vue'),
      meta: { requiresAuth: true },
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

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: 'home' }
  return true
})

export default router
