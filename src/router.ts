import type { RouteRecordRaw } from 'vue-router'

import Dashboard from './/pages/Dashboard.vue'
import Onboarding from './/pages/Onboarding.vue'
import Security from './/pages/Security.vue'
import Expense from './/pages/Expense.vue'
import Tools from './/pages/Tools.vue'
import FAQ from './/pages/FAQ.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'dashboard', component: Dashboard },
  { path: '/onboarding', name: 'onboarding', component: Onboarding, meta: { title: '入職導覽' } },
  { path: '/security', name: 'security', component: Security, meta: { title: '資安訓練' } },
  { path: '/expense', name: 'expense', component: Expense, meta: { title: '報銷教學' } },
  { path: '/tools', name: 'tools', component: Tools, meta: { title: '常用工具' } },
  { path: '/faq', name: 'faq', component: FAQ, meta: { title: '常見問題' } }
]

export default routes