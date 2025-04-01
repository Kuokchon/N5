<script setup>
/**
 * App.vue - 应用程序主组件
 * 
 * 该组件是整个应用的根组件，负责组织应用的整体结构
 * 包含顶部导航栏、内容区域和底部页脚
 * 使用Vue Router的router-view显示当前路由对应的组件
 * 
 * 组件结构：
 * 1. Header - 顶部导航栏，包含logo、导航菜单和用户操作区
 * 2. router-view - 动态内容区域，根据当前路由显示对应组件
 * 3. Footer - 底部页脚，包含产品链接、条款、联系信息和社交媒体链接
 * 4. MessageContainer - 全局消息提示容器
 */

// 导入顶部导航栏组件 - 负责显示网站标题、导航菜单和用户认证按钮
import Header from './components/header.vue'

// 导入底部页脚组件 - 负责显示版权信息、链接和社交媒体图标
import Footer from './components/footer.vue'

// 导入消息容器组件 - 负责显示全局消息提示
import MessageContainer from './components/MessageContainer.vue'

// 导入并初始化主题管理
import { useTheme } from './composables/useTheme';
import { provide, onMounted } from 'vue';
import { useUserStore } from './stores/user';

// 初始化主题并提供给所有组件
const theme = useTheme();
provide('theme', theme);

// 初始化用戶狀態
const userStore = useUserStore();

// 應用啟動時初始化用戶信息
onMounted(() => {
  const token = localStorage.getItem('token');
  if (token) {
    console.log('應用啟動時檢測到token，加載用戶信息');
    userStore.loadUser();
  }
});
</script>

<template>
  <div class="app-container">
    <!-- 使用Header组件 -->
    <Header />

    <!-- 路由视图 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- 使用Footer组件 -->
    <Footer />
    
    <!-- 全局消息提示 -->
    <MessageContainer />
  </div>
</template>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 页面切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
