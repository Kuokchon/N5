<template>
  <div class="admin-layout">
    <!-- 侧边栏导航 -->
    <div class="sidebar" :class="{ 'collapsed': sidebarCollapsed }">
      <div class="sidebar-header">
        <h1 class="logo">管理后台</h1>
        <button class="collapse-btn" @click="toggleSidebar">
          <i :class="sidebarCollapsed ? 'icon-right' : 'icon-left'"></i>
        </button>
      </div>
      
      <nav class="sidebar-menu">
        <router-link to="/admin" class="menu-item" exact>
          <i class="icon-dashboard"></i>
          <span v-if="!sidebarCollapsed">控制台</span>
        </router-link>
        
        <router-link to="/admin/users" class="menu-item" v-if="hasPermission('manage_users')">
          <i class="icon-users"></i>
          <span v-if="!sidebarCollapsed">用户管理</span>
        </router-link>
        
        <router-link to="/admin/ai-apps" class="menu-item" v-if="hasPermission('manage_ai_apps')">
          <i class="icon-apps"></i>
          <span v-if="!sidebarCollapsed">AI应用管理</span>
        </router-link>
        
        <router-link to="/admin/member-cards" class="menu-item" v-if="hasPermission('manage_member_cards')">
          <i class="icon-card"></i>
          <span v-if="!sidebarCollapsed">会员卡管理</span>
        </router-link>
        
        <router-link to="/admin/transactions" class="menu-item" v-if="hasPermission('view_transactions')">
          <i class="icon-transaction"></i>
          <span v-if="!sidebarCollapsed">交易记录</span>
        </router-link>
        
        <router-link to="/admin/administrators" class="menu-item" v-if="hasPermission('manage_admins')">
          <i class="icon-admin"></i>
          <span v-if="!sidebarCollapsed">管理员管理</span>
        </router-link>
        
        <router-link to="/admin/logs" class="menu-item" v-if="hasPermission('view_logs')">
          <i class="icon-log"></i>
          <span v-if="!sidebarCollapsed">操作日志</span>
        </router-link>
        
        <router-link to="/admin/settings" class="menu-item" v-if="hasPermission('manage_settings')">
          <i class="icon-settings"></i>
          <span v-if="!sidebarCollapsed">系统设置</span>
        </router-link>
      </nav>
    </div>

    <!-- 主内容区 -->
    <div class="main-content" :class="{ 'expanded': sidebarCollapsed }">
      <!-- 顶部导航栏 -->
      <header class="top-header">
        <div class="breadcrumb">
          <h2>{{ currentRouteName }}</h2>
        </div>
        
        <div class="header-actions">
          <div class="admin-info">
            <span>{{ admin?.username }}</span>
            <span class="role-tag">{{ getRoleName(admin?.role) }}</span>
          </div>
          
          <div class="dropdown">
            <button class="dropdown-toggle">
              <i class="icon-user"></i>
            </button>
            <div class="dropdown-menu">
              <div class="dropdown-item" @click="logout">退出登录</div>
            </div>
          </div>
        </div>
      </header>
    
      <!-- 内容区 -->
      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAdminStore } from '../../stores/admin';

const router = useRouter();
const route = useRoute();
const adminStore = useAdminStore();

// 侧边栏折叠状态
const sidebarCollapsed = ref(false);

// 获取当前路由名称
const currentRouteName = computed(() => {
  return route.meta.title || '控制台';
});

// 获取管理员信息
const admin = computed(() => adminStore.admin);

// 检查权限
const hasPermission = (permission) => {
  // 基于角色的权限检查
  const adminRole = adminStore.admin?.role;
  
  if (!adminRole) return false;
  
  // 超级管理员拥有所有权限
  if (adminRole === 'super_admin') {
    return true;
  }
  
  // 运营管理员权限
  if (adminRole === 'operation') {
    const operationPermissions = [
      'manage_users', 
      'view_transactions', 
      'view_logs'
    ];
    return operationPermissions.includes(permission);
  }
  
  // 开发者权限
  if (adminRole === 'developer') {
    const developerPermissions = [
      'manage_ai_apps', 
      'manage_settings',
      'view_logs'
    ];
    return developerPermissions.includes(permission);
  }
  
  return false;
};

// 获取角色名称
const getRoleName = (role) => {
  switch (role) {
    case 'super_admin':
      return '超级管理员';
    case 'operation':
      return '运营管理员';
    case 'developer':
      return '开发者';
    default:
      return '管理员';
  }
};

// 切换侧边栏显示状态
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
  // 保存用户偏好
  localStorage.setItem('adminSidebarCollapsed', sidebarCollapsed.value);
};

// 登出
const logout = async () => {
  await adminStore.logout();
  router.push('/admin/login');
};

// 组件挂载时
onMounted(async () => {
  // 恢复侧边栏状态
  const savedState = localStorage.getItem('adminSidebarCollapsed');
  if (savedState !== null) {
    sidebarCollapsed.value = savedState === 'true';
  }
  
  // 检查是否登录
  if (!adminStore.isLoggedIn) {
    // 尝试从用户token恢复管理员信息
    try {
      await adminStore.getAdminInfo();
    } catch (err) {
      console.error('无法获取管理员信息:', err);
    }
    
    // 如果仍未登录，重定向到登录页
    if (!adminStore.isLoggedIn) {
      router.push('/admin/login');
    }
  }
});
</script>

<style scoped>
.admin-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

/* 侧边栏样式 */
.sidebar {
  width: 250px;
  background-color: #001529;
  color: #fff;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  font-size: 18px;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
}

.collapse-btn {
  background: transparent;
  border: none;
  color: #fff;
  cursor: pointer;
  padding: 5px;
}

.sidebar-menu {
  display: flex;
  flex-direction: column;
  padding: 16px 0;
  flex: 1;
  overflow-y: auto;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: rgba(255, 255, 255, 0.65);
  text-decoration: none;
  transition: all 0.3s;
}

.menu-item:hover, .menu-item.router-link-active {
  color: #fff;
  background-color: #1890ff;
}

.menu-item i {
  margin-right: 12px;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  transition: margin-left 0.3s;
  overflow: hidden;
}

.main-content.expanded {
  margin-left: 0;
}

/* 顶部导航栏样式 */
.top-header {
  height: 64px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.breadcrumb h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  align-items: center;
}

.admin-info {
  margin-right: 16px;
  display: flex;
  align-items: center;
}

.role-tag {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}

.dropdown {
  position: relative;
}

.dropdown-toggle {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #333;
}

.dropdown-menu {
  display: none;
  position: absolute;
  right: 0;
  top: 100%;
  background-color: #fff;
  min-width: 120px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  z-index: 1000;
}

.dropdown:hover .dropdown-menu {
  display: block;
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f7f7f7;
}

/* 内容区样式 */
.content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

/* 图标样式 */
.icon-dashboard::before { content: "📊"; }
.icon-users::before { content: "👥"; }
.icon-apps::before { content: "🤖"; }
.icon-card::before { content: "💳"; }
.icon-transaction::before { content: "💰"; }
.icon-admin::before { content: "👤"; }
.icon-log::before { content: "📝"; }
.icon-settings::before { content: "⚙️"; }
.icon-user::before { content: "👤"; }
.icon-left::before { content: "◀"; }
.icon-right::before { content: "▶"; }
</style> 