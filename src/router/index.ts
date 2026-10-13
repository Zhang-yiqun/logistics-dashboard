import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '总览驾驶舱' }
  },
  {
    path: '/exceptions',
    name: 'exceptions',
    component: () => import('@/views/Exceptions.vue'),
    meta: { title: '异常管理' }
  },
  {
    path: '/carriers',
    name: 'carriers',
    component: () => import('@/views/Carriers.vue'),
    meta: { title: '承运商绩效' }
  },
  {
    path: '/cost',
    name: 'cost',
    component: () => import('@/views/CostToServe.vue'),
    meta: { title: '成本到服务' }
  },
  {
    path: '/lanes',
    name: 'lanes',
    component: () => import('@/views/Lanes.vue'),
    meta: { title: '线路时效' }
  },
  {
    path: '/dispatch',
    name: 'dispatch',
    component: () => import('@/views/Dispatch.vue'),
    meta: { title: '智能调度' }
  },
  {
    path: '/billing',
    name: 'billing',
    component: () => import('@/views/Billing.vue'),
    meta: { title: '运费对账' }
  },
  {
    path: '/carbon',
    name: 'carbon',
    component: () => import('@/views/Carbon.vue'),
    meta: { title: '碳排放' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
