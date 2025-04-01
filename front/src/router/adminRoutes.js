import { requireAdmin } from '../middleware/auth';

export default [
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../components/Login.vue'),
    meta: {
      title: '管理员登录',
      layout: 'blank'
    }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: {
      title: '管理控制台',
      requiresAuth: true,
      layout: 'admin'
    },
    beforeEnter: requireAdmin
  },
  // 其他管理路由...
]; 