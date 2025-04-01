// 添加管理后台路由
const adminRoutes = [
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue'),
        meta: { title: '管理控制台' }
      },
      {
        path: 'users',
        name: 'UserManagement',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { title: '用户管理', permission: 'manage_users' }
      },
      {
        path: 'ai-apps',
        name: 'AiAppManagement',
        component: () => import('../views/admin/AiAppManagement.vue'),
        meta: { title: 'AI应用管理', permission: 'manage_ai_apps' }
      },
      {
        path: 'member-cards',
        name: 'MemberCardManagement',
        component: () => import('../views/admin/MemberCardManagement.vue'),
        meta: { title: '会员卡管理', permission: 'manage_member_cards' }
      },
      {
        path: 'transactions',
        name: 'TransactionManagement',
        component: () => import('../views/admin/TransactionManagement.vue'),
        meta: { title: '交易记录', permission: 'view_transactions' }
      },
      {
        path: 'administrators',
        name: 'AdminManagement',
        component: () => import('../views/admin/AdminManagement.vue'),
        meta: { title: '管理员管理', permission: 'manage_admins' }
      },
      {
        path: 'logs',
        name: 'OperationLogs',
        component: () => import('../views/admin/OperationLogs.vue'),
        meta: { title: '操作日志', permission: 'view_logs' }
      },
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('../views/admin/SystemSettings.vue'),
        meta: { title: '系统设置', permission: 'manage_settings' }
      }
    ]
  },
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('../views/admin/AdminLogin.vue'),
    meta: { title: '管理员登录' }
  }
];

// 将管理后台路由添加到主路由
const routes = [
  // ... existing code ...
].concat(adminRoutes);

// 添加路由守卫，检查管理员权限
router.beforeEach(async (to, from, next) => {
  // ... existing code ...
  
  // 检查管理员权限
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    const adminToken = localStorage.getItem('adminToken');
    if (!adminToken) {
      next({ name: 'AdminLogin', query: { redirect: to.fullPath } });
      return;
    }
    
    // 如果路由需要特定权限，检查管理员是否有此权限
    if (to.meta.permission) {
      // 实际应用中可能需要从store或API获取权限
      const adminStore = useAdminStore();
      if (!adminStore.hasPermission(to.meta.permission)) {
        next({ name: 'AdminDashboard' });
        return;
      }
    }
  }
  
  next();
});

// ... existing code ... 