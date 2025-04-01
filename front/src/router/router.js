/**
 * router.js - 应用程序路由配置文件
 * 
 * 该文件定义了应用的所有路由配置，包括路径、组件映射和路由元数据
 * 实现了基于Vue Router的前端路由系统，支持路由守卫进行权限控制
 */
import { createRouter, createWebHistory } from 'vue-router';

// 导入视图组件
import Home from '../views/Home.vue';
// 登錄和註冊組件已移動到components目錄
import Login from '../components/Login.vue';
import Register from '../components/Register.vue';
import AIApps from '../views/work/AIApps.vue';
import NotFound from '../views/NotFound.vue';
import Admin from '../views/admin/AdminLayout.vue';
import AdminLogin from '../components/Login.vue';

// 个人中心布局
import IntoLayout from '../views/into/IntoLayout.vue';
import Balance from '../views/into/Balance.vue';
import TopUp from '../views/into/TopUp.vue';
import Transactions from '../views/into/Transactions.vue';
import UserProfile from '../views/into/UserProfile.vue';
import Settings from '../views/into/Settings.vue';

/**
 * 路由配置数组
 * 每个路由对象包含路径、名称、组件和元数据
 * meta.requiresAuth: 标记该路由是否需要登录才能访问
 */
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresAuth: false }
  },
  {
    path: '/ai-apps',
    name: 'AIApps',
    component: AIApps,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLogin,
    meta: { requiresAuth: true }
  },
  // 个人中心相关路由
  {
    path: '/',
    component: IntoLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'balance',
        name: 'Balance',
        component: Balance,
        meta: { requiresAuth: true }
      },
      {
        path: 'topup',
        name: 'TopUp',
        component: TopUp,
        meta: { requiresAuth: true }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: Transactions,
        meta: { requiresAuth: true }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: UserProfile,
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings,
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { requiresAuth: false }
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫，处理需要认证的页面
router.beforeEach((to, from, next) => {
  try {
    // 检查页面是否需要登录
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const token = localStorage.getItem('token');
    
    // 检查token是否有效
    const isTokenValid = token && token.length > 10; // 简单的有效性检查
    
    // 如果页面需要登录但用户未登录，则重定向到登录页
    if (requiresAuth && !isTokenValid) {
      console.log('需要認證，重定向到登录頁', { path: to.fullPath });
      next({ 
        name: 'Login', 
        query: { redirect: to.fullPath },
        replace: true 
      });
    }
    // 如果用户已登录且正在访问登录或注册页，则重定向到仪表盘
    else if (isTokenValid && (to.name === 'Login' || to.name === 'Register')) {
      console.log('已經登录，重定向到余额頁');
      next({ name: 'Balance', replace: true });
    }
    // 否则允许访问
    else {
      next();
    }
  } catch (error) {
    console.error('路由守衛錯誤:', error);
    // 發生錯誤時，重置狀態並導航到安全頁面
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    next({ name: 'Home', replace: true });
  }
});

export default router;