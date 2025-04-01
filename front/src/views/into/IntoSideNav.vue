<script setup>
/**
 * SideNav.vue - 侧边导航栏组件
 * 
 * 该组件提供个人中心页面的侧边导航功能，包含账户余额、充值、交易记录和个人资料等导航项
 * 使用Vue Router实现页面导航，提供良好的用户体验
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// 获取当前路由信息，用于高亮显示当前页面
const route = useRoute();

// 计算当前活动的路由路径
const currentPath = computed(() => route.path);

// 导航菜单项
const navItems = [
  {
    path: '/balance',
    name: '账户余额',
    icon: 'fa-tachometer-alt'
  },
  {
    path: '/topup',
    name: '账户充值',
    icon: 'fa-credit-card'
  },
  {
    path: '/transactions',
    name: '交易记录',
    icon: 'fa-history'
  },
  {
    path: '/profile',
    name: '个人资料',
    icon: 'fa-user'
  },
  {
    path: '/settings',
    name: '设置',
    icon: 'fa-cog'
  }
];

// 判断导航项是否为当前活动项
const isActive = (path) => {
  return currentPath.value === path;
};
</script>

<template>
  <div class="side-nav">
    <div class="nav-header">
      <h3>个人中心</h3>
    </div>
    
    <div class="nav-items">
      <router-link 
        v-for="item in navItems" 
        :key="item.path" 
        :to="item.path"
        class="nav-item"
        :class="{ 'active': isActive(item.path) }"
      >
        <i :class="['fas', item.icon, 'nav-icon']"></i>
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.side-nav {
  width: 240px;
  background-color: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 160px 0;
  height: 100%;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.nav-header {
  padding: 0 20px 15px;
  margin-bottom: 10px;
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.nav-header h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary, #1f2937);
  margin: 0;
}

.nav-items {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-primary, #1f2937);
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.04));
}

.nav-item.active {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

.nav-icon {
  width: 20px;
  margin-right: 12px;
  text-align: center;
  font-size: 1rem;
}

.nav-text {
  font-size: 0.95rem;
  font-weight: 500;
}

/* 暗黑模式适配 */
:global(.dark) .nav-item.active {
  background-color: var(--primary-color, #3b82f6);
  color: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .side-nav {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .nav-items {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px;
    padding: 0 15px;
  }
  
  .nav-item {
    padding: 10px 15px;
  }
}
</style>