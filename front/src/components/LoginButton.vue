<script setup>
/**
 * LoginButton.vue - 登錄按鈕組件
 * 
 * 該組件提供登錄/註冊功能，以及用戶登錄後的下拉菜單
 * 與Login.vue頁面進行連接，實現用戶身份驗證
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import UserAvatar from './UserAvatar.vue';
import { useStore } from 'vuex';

// 使用Pinia狀態
const userStore = useUserStore();

// 使用Vuex狀態
const vuexStore = useStore();

// 計算屬性：是否已登錄
const isLoggedIn = computed(() => userStore.isLoggedIn);

// 計算屬性：用戶信息
const username = computed(() => userStore.username);
const userId = computed(() => userStore.userId);
const userAvatarUrl = computed(() => userStore.avatarUrl);

// 計算屬性：會員卡和免費額度信息
const memberCardBalance = computed(() => vuexStore.getters.memberCardBalance || 0);
const freeBalance = computed(() => vuexStore.getters.freeBalance || 0);
const hasFreeQuota = computed(() => vuexStore.getters.hasFreeQuota || false);

// 下拉菜單顯示狀態
const isOpen = ref(false);
const dropdownMenu = ref(null);

// 創建路由實例
const router = useRouter();

// 切換下拉菜單顯示/隱藏
const toggle_dropdown = () => {
  isOpen.value = !isOpen.value;
};

// 關閉下拉菜單
const close_dropdown = () => {
  isOpen.value = false;
};

// 處理外部點擊
const handleOutsideClick = (e) => {
  if (isOpen.value && 
      dropdownMenu.value && 
      !dropdownMenu.value.contains(e.target) && 
      !e.target.closest('.user-trigger')) {
    close_dropdown();
  }
};

// 登入表單
const show_login_form = () => {
  router.push('/login');
};

// 登出
const logout = () => {
  try {
    // 清除登錄狀態
    userStore.logout();
    
    // 清除所有本地存儲數據
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_cache');
    
    // 關閉下拉菜單
    close_dropdown();
  } catch (error) {
    console.error('登出時發生錯誤:', error);
  }
};

// 處理頭像上傳
const handleAvatarUpload = ({ formData }) => {
  userStore.uploadAvatar(formData);
};

// 在元件掛載時，檢查登入狀態
onMounted(async () => {
  try {
    // 點擊外部時關閉下拉菜單
    document.addEventListener('click', handleOutsideClick);
    
    // 檢查是否已經登入
    const token = localStorage.getItem('token');
    if (token) {
      console.log('檢測到已登錄狀態，延遲加載用戶數據');
      // 延遲加載用户数据，避免頁面載入時阻塞渲染
      setTimeout(() => {
        userStore.loadUser().catch(err => {
          console.warn('加載用戶數據出錯，但不影響界面:', err.message);
        });
        
        // 加載會員卡和免費額度信息
        vuexStore.dispatch('fetchMemberCard').catch(err => {
          console.warn('加載會員卡數據出錯:', err.message);
        });
        vuexStore.dispatch('fetchFreeQuota').catch(err => {
          console.warn('加載免費額度數據出錯:', err.message);
        });
      }, 500);
    }
  } catch (error) {
    console.error('檢查登入狀態時出錯:', error);
  }
});

// 組件卸載時移除事件監聽
onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick);
});

// 監視登錄狀態變化
watch(isLoggedIn, (newValue) => {
  if (newValue) {
    // 用戶登入後，加載用戶數據
    userStore.loadUser();
  }
});
</script>

<template>
  <div class="relative login-component">
    <!-- 未登錄狀態 -->
    <div v-if="!isLoggedIn" class="login-btn-container">
      <button 
        @click="show_login_form" 
        class="login-btn"
      >
        <i class="fas fa-sign-in-alt mr-1"></i>
        <span>登入</span>
      </button>
    </div>

    <!-- 已登錄狀態 -->
    <div v-else class="user-profile-container">
      <div 
        @click="toggle_dropdown" 
        class="user-trigger"
      >
        <UserAvatar 
          :src="userAvatarUrl" 
          :size="36" 
          :username="username"
          :userId="userId" 
          @upload="handleAvatarUpload"
          class="avatar-wrapper"
        />
        <span class="username">{{ username }}</span>
        <i :class="['dropdown-icon', isOpen ? 'fa-caret-up' : 'fa-caret-down']"></i>
      </div>

      <!-- 下拉菜單 -->
      <transition 
        name="dropdown"
        enter-active-class="transition ease-out duration-200"
        enter-from-class="opacity-0 translate-y-1 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-1 scale-95"
      >
        <div 
          v-show="isOpen" 
          class="dropdown-menu"
          ref="dropdownMenu"
        >
          <!-- 會員卡和免費額度信息 -->
          <div class="account-info-section" v-if="isLoggedIn">
            <div class="account-info-item">
              <span class="info-label">今日免費額度:</span>
              <span class="info-value">{{ freeBalance.toFixed(2) }}</span>
            </div>
            <div class="account-info-item">
              <span class="info-label">帳戶餘額:</span>
              <span class="info-value">{{ memberCardBalance.toFixed(2) }}</span>
            </div>
          </div>
          <div class="divider" v-if="isLoggedIn"></div>
          
          <router-link 
            to="/balance" 
            class="dropdown-item"
            @click="close_dropdown"
          >
            <i class="fas fa-tachometer-alt item-icon"></i>
            <span>儀表板</span>
          </router-link>
          
          <router-link 
            to="/profile" 
            class="dropdown-item"
            @click="close_dropdown"
          >
            <i class="fas fa-user item-icon"></i>
            <span>個人資料</span>
          </router-link>
          
          <router-link 
            to="/settings" 
            class="dropdown-item"
            @click="close_dropdown"
          >
            <i class="fas fa-cog item-icon"></i>
            <span>設置</span>
          </router-link>
          
          <div class="divider"></div>
          
          <div class="logout-container">
            <button 
              @click="logout" 
              class="logout-button"
            >
              <span>登出</span>
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.login-component {
  position: relative;
  z-index: 100;
}

/* 登錄按鈕樣式 */
.login-btn-container {
  display: flex;
  align-items: center;
}

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 18px;
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px var(--shadow-color, rgba(0, 0, 0, 0.15));
  border: none;
  position: relative;
  overflow: hidden;
}

.login-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.login-btn:hover::before {
  opacity: 1;
}

.login-btn:hover {
  background-color: var(--color-primary-dark, #2563eb);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px var(--shadow-color, rgba(0, 0, 0, 0.2));
}

.login-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 5px var(--shadow-color, rgba(0, 0, 0, 0.1));
}

.login-btn i {
  font-size: 14px;
  margin-right: 8px;
}

/* 用戶資料區域樣式 */
.user-profile-container {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  background-color: var(--user-bg, var(--hover-bg, rgba(0, 0, 0, 0.05)));
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.user-trigger:hover {
  background-color: var(--user-bg-hover, var(--hover-bg, rgba(0, 0, 0, 0.1)));
  border-color: var(--border-color, rgba(0, 0, 0, 0.08));
  transform: translateY(-1px);
}

.avatar-wrapper {
  margin-right: 10px;
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.username {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, #1f2937);
  margin: 0 6px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.3s ease;
}

.dropdown-icon {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  margin-left: 4px;
  transition: transform 0.2s ease;
}

.dropdown-icon.fa-caret-up {
  transform: rotate(180deg);
}

/* 下拉菜單樣式 */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 220px;
  background-color: var(--dropdown-bg, var(--card-bg, white));
  border-radius: 12px;
  box-shadow: 0 10px 30px -5px var(--shadow-color, rgba(0, 0, 0, 0.15)), 
              0 8px 15px -6px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
  overflow: hidden;
  transform-origin: top right;
  z-index: 120;
  backdrop-filter: blur(8px);
}

/* 帳戶信息區域樣式 */
.account-info-section {
  padding: 16px 20px;
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
}

.account-info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.account-info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.info-value {
  color: var(--color-primary, #3498db);
  font-weight: 600;
}

.dropdown-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: var(--text-primary, #1f2937);
  text-decoration: none;
  transition: all 0.3s ease;
  font-size: 14px;
  position: relative;
  overflow: hidden;
}

.dropdown-item:hover {
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.04));
  padding-left: 24px;
}

.dropdown-item:hover .item-icon {
  transform: scale(1.1);
  color: var(--color-primary, #3498db);
}

.dropdown-item:active {
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.08));
}

.item-icon {
  width: 20px;
  margin-right: 12px;
  text-align: center;
  color: var(--text-secondary, #6b7280);
  transition: all 0.3s ease;
}

.divider {
  height: 1px;
  background-color: var(--border-color, rgba(0, 0, 0, 0.08));
  margin: 8px 0;
}

.logout-container {
  padding: 4px 16px;
  display: flex;
  justify-content: flex-end;
}

.logout-button {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  background-color: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-danger, #ef4444);
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
}

.logout-button i {
  margin-left: 10px;
  margin-right: 90px;
  color: var(--color-danger, #ef4444);
}

.logout-button:hover {
  background-color: var(--danger-hover-bg, rgba(239, 68, 68, 0.1));
  border-color: rgba(239, 68, 68, 0.2);
  transform: translateY(-1px);
}

.logout-button:hover i {
  transform: translateX(2px);
}

/* 移除不必要的暗黑模式樣式覆蓋，僅保留不能通過CSS變量處理的特殊樣式 */
:global(.dark) .login-btn {
  background-color: var(--color-primary, #3b82f6);
}

:global(.dark) .login-btn:hover {
  background-color: var(--color-primary-dark, #2563eb);
}

:global(.dark) .logout-button {
  color: var(--color-danger, #f87171);
}

:global(.dark) .logout-button i {
  color: var(--color-danger, #f87171);
}

:global(.dark) .logout-button:hover {
  background-color: var(--danger-hover-bg, rgba(248, 113, 113, 0.1));
}
</style>