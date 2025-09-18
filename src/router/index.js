import { createRouter, createWebHistory } from 'vue-router'

import Dashboard from '../views/Dashboard.vue'
import Training from '../views/Training.vue'
import CourseDetail from '../views/CourseDetail.vue'
import Wellbeing from '../views/Wellbeing.vue'
import Community from '../views/Community.vue'
import Notifications from '../views/Notifications.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import OfficeTour from '../views/OfficeTour.vue'

const routes = [
  { path: '/', name: 'Dashboard', component: Dashboard },
  { path: '/training', name: 'Training', component: Training },
  { path: '/training/course/:id', name: 'CourseDetail', component: CourseDetail, props: true },
  { path: '/wellbeing', name: 'Wellbeing', component: Wellbeing },
  { path: '/community', name: 'Community', component: Community },
  { path: '/notifications', name: 'Notifications', component: Notifications },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/tour', name: 'OfficeTour', component: OfficeTour },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router