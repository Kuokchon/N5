<script setup>
/**
 * IntoLayout.vue - 个人中心布局组件
 * 
 * 该组件提供个人中心页面的通用布局，包含侧边导航栏和内容区域
 * 作为个人中心各页面的容器，提供一致的用户界面体验
 */
import { ref, onMounted, onUnmounted } from 'vue';
import SideNav from '../into/IntoSideNav.vue';

// 主題控制
const isDarkMode = ref(false);

// 切換主題
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  
  // 將主題偏好保存到localStorage，僅對個人中心有效
  localStorage.setItem('intoThemeDark', isDarkMode.value ? 'true' : 'false');
}

// 組件掛載時檢查用戶主題偏好
onMounted(() => {
  // 從localStorage讀取個人中心的主題設置
  const savedTheme = localStorage.getItem('intoThemeDark');
  
  if (savedTheme === 'true') {
    isDarkMode.value = true;
  }
});
</script>

<template>
  <div class="into-layout" :class="{ 'dark-mode': isDarkMode }">
    <div class="theme-toggle">
      <button @click="toggleTheme" class="theme-toggle-btn">
        <span v-if="isDarkMode">☀️</span>
        <span v-else>🌙</span>
      </button>
    </div>
    
    <div class="into-container">
      <!-- 侧边导航栏 -->
      <div class="side-nav-container">
        <SideNav />
      </div>
      
      <!-- 内容区域 -->
      <div class="content-container">
        <router-view />
      </div>
    </div>
  </div>
</template>

<style scoped>
.into-layout {
  width: 100%;
  min-height: calc(100vh - 80px); /* 减去头部导航的高度 */
  padding: 30px 20px;
  background-color: var(--into-bg-color);
  transition: all 0.3s ease;
  position: relative;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.into-layout.dark-mode {
  --into-bg-color: #121212;
  --into-card-bg: #1e1e1e;
  --into-text-color: #e0e0e0;
  --into-border-color: #333;
  --into-hover-color: #333;
  background-color: var(--into-bg-color);
  color: var(--into-text-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
}

.into-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  gap: 25px;
}

.side-nav-container {
  flex-shrink: 0;
  background-color: var(--into-card-bg);
  border-radius: 10px;
  padding: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.content-container {
  flex: 1;
  min-width: 0; /* 防止内容溢出 */
  background-color: var(--into-card-bg);
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.theme-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
}

.theme-toggle-btn {
  background-color: var(--into-card-bg, #ffffff);
  border: 1px solid var(--into-border-color, #e0e0e0);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.theme-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dark-mode .theme-toggle-btn {
  background-color: #2d2d2d;
  border-color: #444;
  color: #fff;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .into-container {
    flex-direction: column;
  }
  
  .side-nav-container,
  .content-container {
    width: 100%;
  }
  
  .into-layout {
    padding: 15px 10px;
  }
  
  .theme-toggle {
    top: 10px;
    right: 10px;
  }
  
  .theme-toggle-btn {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }
}

/* 為確保主題顏色正確傳遞給子組件 */
:deep(.into-component) {
  color: var(--into-text-color, inherit);
  background-color: var(--into-card-bg, inherit);
  border-color: var(--into-border-color, inherit);
}
</style>