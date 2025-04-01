/**
 * useTheme.js - 主題切換組合式函數
 * 
 * 提供全局主題狀態管理和切換功能
 * 支持跟隨系統主題或手動設置
 */

import { ref, computed, watch, onMounted } from 'vue';

export function useTheme() {
  // 主题状态
  const isDarkTheme = ref(false);
  // 是否跟随系统
  const followsSystem = ref(false);
  // 系统偏好
  const systemPrefersDark = ref(false);
  
  // 初始化
  onMounted(() => {
    // 读取本地存储的主题设置
    const savedTheme = localStorage.getItem('theme');
    const savedFollowsSystem = localStorage.getItem('followsSystem') === 'true';
    
    followsSystem.value = savedFollowsSystem;
    
    // 检测系统偏好
    const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = prefersDarkQuery.matches;
    
    // 设置初始主题
    if (followsSystem.value) {
      isDarkTheme.value = systemPrefersDark.value;
    } else if (savedTheme) {
      isDarkTheme.value = savedTheme === 'dark';
    }
    
    // 应用主题
    applyTheme();
    
    // 监听系统主题变化
    prefersDarkQuery.addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches;
      
      // 如果设置为跟随系统，则自动切换
      if (followsSystem.value) {
        isDarkTheme.value = systemPrefersDark.value;
        applyTheme();
      }
    });
  });
  
  // 监听主题变化
  watch(isDarkTheme, () => {
    applyTheme();
    saveThemePreference();
  });
  
  // 监听跟随系统设置变化
  watch(followsSystem, () => {
    if (followsSystem.value) {
      // 切换到系统偏好
      isDarkTheme.value = systemPrefersDark.value;
    }
    
    localStorage.setItem('followsSystem', followsSystem.value);
  });
  
  // 切换主题
  function toggleTheme() {
    // 切换时自动关闭跟随系统
    if (followsSystem.value) {
      followsSystem.value = false;
    }
    
    isDarkTheme.value = !isDarkTheme.value;
  }
  
  // 设置跟随系统状态
  function setFollowSystem(value) {
    followsSystem.value = value;
  }
  
  // 应用主题到DOM
  function applyTheme() {
    // 更新document属性
    if (isDarkTheme.value) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    // 更新状态栏颜色（对移动设备）
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content', 
        isDarkTheme.value ? '#121212' : '#ffffff'
      );
    }
  }
  
  // 保存主题偏好到本地存储
  function saveThemePreference() {
    localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light');
  }
  
  // 公开的状态和方法
  return {
    isDarkTheme,
    followsSystem,
    systemPrefersDark,
    toggleTheme,
    setFollowSystem
  };
} 