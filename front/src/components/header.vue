<script setup>
/**
 * header.vue - 頂部導航欄組件
 * 
 * 該組件提供網站的頂部導航功能，包含公司logo、語言選擇、主題切換
 * 使用Vue Router實現頁面導航，提供良好的用戶體驗
 * 登錄按鈕功能已移至LoginButton組件
 */
import { ref, computed, provide, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import LoginButton from './LoginButton.vue';
import ThemeToggle from './ThemeToggle.vue';
import ThemeSettingsPanel from './ThemeSettingsPanel.vue';
import UserAvatar from './UserAvatar.vue';
import { useUserStore } from '../stores/user';
import { useTheme } from '../composables/useTheme';

// 用户状态管理
const userStore = useUserStore();
const router = useRouter();

// 打開用戶菜單
const openUserMenu = () => {
  router.push('/profile');
};

// 检查登录状态并加载用户信息
onMounted(async () => {
  try {
    // 延遲加載用戶信息，避免影響頁面初始渲染
    setTimeout(async () => {
      // 登錄狀態監測和用戶數據加載
      const token = localStorage.getItem('token');
      if (token) {
        console.log('檢測到token，嘗試加載用戶信息');
        try {
          await userStore.loadUser();
        } catch (err) {
          console.warn('加載用戶信息失敗，但不阻止頁面渲染:', err.message);
        }
      }
    }, 1000);
    
    // 使用事件監聽器來監聽登錄狀態變化
    window.addEventListener('storage', async (event) => {
      if (event.key === 'token') {
        console.log('檢測到token變化，刷新用戶信息');
        if (event.newValue) {
          try {
            await userStore.loadUser(true); // 強制重新加載
          } catch (err) {
            console.warn('Token變化後加載用戶失敗:', err.message);
          }
        } else {
          userStore.logout();
        }
      }
    });
  } catch (error) {
    console.error('掛載階段錯誤:', error);
  }
});

// 創建一個自定義事件處理程序來監聽登錄狀態變化
const handleLoginStateChange = () => {
  console.log('登錄狀態變化，刷新用戶信息');
  const token = localStorage.getItem('token');
  if (token) {
    userStore.loadUser(true); // 強制重新加載
  }
};

// 向全局事件匯總器添加事件監聽器
onMounted(() => {
  window.addEventListener('login-state-change', handleLoginStateChange);
});

onUnmounted(() => {
  window.removeEventListener('login-state-change', handleLoginStateChange);
  window.removeEventListener('storage', handleLoginStateChange);
});

// 主題管理
const { isDarkTheme, followsSystem, systemPrefersDark, toggleTheme, setFollowSystem } = useTheme();

// 根據主題選擇Logo
const logoImage = computed(() => isDarkTheme.value ? '/src/assets/logo2.png' : '/src/assets/logo1.png');

// 提供主題狀態給所有子組件
provide('isDarkTheme', isDarkTheme);

// 主題設置面板
const isThemeSettingsPanelOpen = ref(false);

// 打開主題設置面板
const openThemeSettingsPanel = () => {
  isThemeSettingsPanelOpen.value = true;
};

// 手動設置主題
const setTheme = (isDark) => {
  isDarkTheme.value = isDark;
};

// 移动端菜单状态
const isMobileMenuOpen = ref(false);

// 切换移动端菜单
const toggle_mobile_menu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

// 处理头像上传
const handleAvatarUpload = async ({ formData, userId }) => {
  try {
    console.log('收到頭像上傳請求');
    
    // 確保有正確的用戶ID
    if (!userId) {
      const currentUserId = userStore.userId;
      console.log('從store中獲取當前用戶ID:', currentUserId);
      
      if (currentUserId) {
        formData.append('userId', currentUserId);
      }
    }
    
    // 使用userStore上傳頭像
    const result = await userStore.uploadAvatar(formData);
    if (!result) {
      console.warn('頭像上傳可能失敗');
    }
  } catch (error) {
    console.error('頭像上傳過程中發生錯誤:', error);
  }
};
</script>

<template>
  <!-- 頂部導航欄 -->
  <header class="header">
    <nav class="navbar">
      <router-link to="/" class="logo-container">
        <img :src="logoImage" alt="公司logo" class="site-logo" />
      </router-link>
      
      <!-- 用戶操作區域 - 包含主題切換和登錄按鈕或用戶信息 -->
      <div class="user-actions">
        <!-- 使用ThemeToggle組件 -->
        <div class="theme-controls">
          <ThemeToggle 
            @toggle="toggleTheme" 
            @setFollowSystem="setFollowSystem"
            :isDarkTheme="isDarkTheme" 
            :followsSystem="followsSystem"
          />
        </div>
        
        <!-- 已登錄顯示用戶信息 -->
        <!-- 使用LoginButton組件來處理已登錄和未登錄狀態 -->
        <LoginButton />
      </div>
      
    </nav>
    
    <!-- 移动端菜单遮罩 -->
    <div class="mobile-menu-overlay" v-if="isMobileMenuOpen" @click="toggle_mobile_menu"></div>
    
    <!-- 主題設置面板 -->
    <ThemeSettingsPanel
      :isOpen="isThemeSettingsPanelOpen"
      @update:isOpen="isThemeSettingsPanelOpen = $event"
      :isDarkTheme="isDarkTheme"
      :followsSystem="followsSystem"
      :systemPrefersDark="systemPrefersDark"
      @setTheme="setTheme"
      @setFollowSystem="setFollowSystem"
    />
  </header>
</template>

<style scoped>
/* 頂部導航欄樣式 */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--header-bg, #ffffff);
  color: var(--header-text, #000000);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--header-border, #e5e7eb);
  transition: var(--theme-transition, all 0.3s ease);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 2rem;
  max-width: 1440px;
  margin: 0 auto;
  height: 80px;
  transform: translateY(0) !important; /* 確保導航欄始終可見 */
}

.logo-container {
  display: flex;
  align-items: center;
  z-index: 10;
  text-decoration: none;
}

.site-logo {
  width: 100px;
  height: 80px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.site-logo:hover {
  transform: scale(1.05);
}

/* 用戶操作區域 */
.user-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 5;
  margin-left: auto;
  margin-right: 0;
  background-color: var(--user-actions-bg, rgba(0, 0, 0, 0.1));
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

/* 主題控制區域 */
.theme-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-settings-button {
  background: transparent;
  border: none;
  color: var(--text-secondary, #757575);
  cursor: pointer;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.theme-settings-button:hover {
  color: var(--color-primary, #2196f3);
  background: rgba(var(--color-primary-rgb, 33, 150, 243), 0.1);
  transform: rotate(30deg);
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .navbar {
    padding: 0.5rem 0.8rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .nav-link {
    font-size: 0.9rem;
    padding: 0.5rem 0.6rem;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.5rem 0.8rem;
  }
  
  .mobile-menu-toggle {
    display: flex;
  }
  
  .nav-center {
    position: fixed;
    top: 80px;
    right: -300px;
    width: 280px;
    height: 100vh;
    background: var(--primary-dark);
    transition: right 0.3s ease;
    border-left: 1px solid rgba(0, 247, 255, 0.1);
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
    z-index: 5;
    padding: 2rem 1rem;
  }
  
  .nav-center.mobile-open {
    right: 0;
  }
  
  .nav-links {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  
  .nav-link {
    width: 100%;
    padding: 0.8rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .nav-link:hover {
    background: rgba(0, 247, 255, 0.05);
  }
  
  .mobile-menu-overlay {
    display: block;
  }
}

@media (max-width: 480px) {
  .navbar {
    padding: 0.5rem 0.8rem;
  }
  
  .site-logo {
    width: 80px;
    height: 60px;
  }
  
  .user-actions {
    gap: 0.5rem;
  }
  
  .theme-settings-button {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}

/* 用戶信息顯示 */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.user-info:hover {
  background-color: var(--hover-bg);
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 覆蓋全局scroll事件對導航欄的影響 */
body {
  scroll-behavior: smooth;
}
</style>