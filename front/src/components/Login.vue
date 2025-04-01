<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">{{ pageTitle }}</h2>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="email">邮箱</label>
          <input 
            type="email" 
            id="email" 
            v-model="email" 
            placeholder="请输入邮箱" 
            required
            :disabled="loading"
          >
        </div>
        
        <div class="form-group">
          <label for="password">密码</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="请输入密码" 
            required
            :disabled="loading"
          >
        </div>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        
        <button 
          type="submit" 
          class="login-button" 
          :disabled="loading || !email || !password"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loginButtonText }}
        </button>
      </form>
      
      <div class="login-footer">
        <p>还没有账号？<router-link to="/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import store from '../services/store';
import { useUserStore } from '../stores/user';
import { useAdminStore } from '../stores/admin';
import { authAPI } from '../services/api';

const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);
const loginAttempts = ref(0);

// 使用Pinia的用戶存儲
const userStore = useUserStore();
const adminStore = useAdminStore();

// 檢查當前是否為管理員登錄頁面
const isAdminLogin = computed(() => route.path.includes('/admin/login'));

// 頁面標題根據登錄類型變化
const pageTitle = computed(() => isAdminLogin.value ? '管理後台登入' : '帳號登入');

// 登錄按鈕文字
const loginButtonText = computed(() => loading.value ? '登入中...' : '登入');

// 檢查是否有重定向參數，提示用戶需要登錄
onMounted(() => {
  if (route.query.redirect) {
    error.value = '請先登錄以繼續訪問';
  }
  
  // 預填充邮箱（如果本地存儲中有）
  const savedEmail = localStorage.getItem('lastLoginEmail');
  if (savedEmail) {
    email.value = savedEmail;
  }
});

const handleLogin = async () => {
  error.value = '';
  loading.value = true;
  loginAttempts.value++;
  
  // 輸出調試信息
  console.log('==== 登錄流程開始 ====');
  console.log('登錄信息：', { email: email.value, password: '***' });
  console.log('當前API地址：', localStorage.getItem('api_base_url') || '(使用默認值)');
  console.log('登錄嘗試次數：', loginAttempts.value);
  console.log('登錄類型：', isAdminLogin.value ? '管理員登錄' : '普通用戶登錄');
  
  // 保存邮箱以便下次自動填充
  localStorage.setItem('lastLoginEmail', email.value);
  
  // 非阻塞地進行API健康檢查，不影響主流程
  try {
    if (window.checkApiHealth && typeof window.checkApiHealth === 'function') {
      window.checkApiHealth()
        .then(result => console.log('API健康檢查結果：', result))
        .catch(err => console.warn('API健康檢查錯誤，但不影響登錄流程：', err));
    } else {
      // 嘗試從api服務中動態導入checkApiHealth函數
      import('../services/api').then(({ authAPI }) => {
        if (authAPI && authAPI.checkApiHealth) {
          authAPI.checkApiHealth()
            .then(result => console.log('API健康檢查結果：', result))
            .catch(err => console.warn('API健康檢查錯誤，但不影響登錄流程：', err));
        } else {
          console.log('API健康檢查函數不可用，跳過檢查');
        }
      }).catch(err => console.warn('導入API服務失敗:', err));
    }
  } catch (err) {
    console.warn('API健康檢查調用出錯，但不影響登錄流程：', err);
  }
  
  try {
    console.log('正在調用登錄API...');
    
    // 根據登錄類型選擇不同的登錄方式
    if (isAdminLogin.value) {
      // 管理員登錄
      try {
        await adminStore.login({
          username: email.value, // 管理員登錄可使用用戶名、郵箱或手機號
          password: password.value
        });
        
        console.log('管理員登錄成功');
        
        // 登錄成功，重定向到管理員儀表板或請求的頁面
        const redirectPath = route.query.redirect || '/admin';
        router.push(redirectPath);
      } catch (adminErr) {
        console.error('管理員登錄錯誤:', adminErr);
        
        // 嘗試普通用戶登錄
        try {
          console.log('嘗試普通用戶登錄...');
          const result = await store.login(email.value, password.value);
          
          if (result.success) {
            console.log('普通用戶登錄成功，檢查是否有管理員權限...');
            
            // 加載用戶詳細信息
            await userStore.loadUser(true);
            
            // 檢查用戶是否有管理員權限
            const userInfo = userStore.user;
            if (userInfo && userInfo.is_admin) {
              console.log('用戶具有管理員權限，轉向管理後台');
              
              // 設置管理員令牌與普通用戶令牌相同
              localStorage.setItem('admin_token', localStorage.getItem('token'));
              
              // 加載管理員信息
              try {
                await adminStore.getAdminInfo();
              } catch (adminInfoErr) {
                console.warn('獲取管理員信息失敗，但仍然允許訪問:', adminInfoErr);
              }
              
              // 重定向到管理後台
              const redirectPath = route.query.redirect || '/admin';
              router.push(redirectPath);
            } else {
              console.log('用戶沒有管理員權限，不能登錄後台');
              error.value = '您沒有管理員權限，無法訪問後台';
            }
          } else {
            console.log('普通用戶登錄也失敗');
            error.value = '登錄失敗，請檢查用戶名和密碼';
          }
        } catch (userLoginErr) {
          console.error('嘗試普通用戶登錄也失敗:', userLoginErr);
          error.value = '管理員登錄失敗，請檢查用戶名和密碼';
        }
      }
    } else {
      // 普通用戶登錄
      const result = await store.login(email.value, password.value);
      console.log('登錄API響應：', result);
      
      if (result.success) {
        console.log('登錄成功，用戶數據：', store.getUser());
        
        // 使用userStore加載用戶詳細信息
        try {
          await userStore.loadUser(true);
          console.log('Pinia用戶狀態更新完成:', userStore.user);
          
          // 檢查用戶是否有管理員權限
          const userInfo = userStore.user;
          if (userInfo && userInfo.is_admin) {
            console.log('用戶具有管理員權限，設置管理員令牌');
            localStorage.setItem('admin_token', localStorage.getItem('token'));
          }
        } catch (userErr) {
          console.warn('加載用戶詳細信息失敗，但不影響登錄流程：', userErr);
        }
        
        console.log('登錄成功，正在重定向...');
        // 登录成功，重定向到原页面或余额页
        const redirectPath = route.query.redirect || '/balance';
        
        // 如果有跳转参数，稍微延迟跳转让用户感知到登录成功
        if (route.query.redirect) {
          setTimeout(() => {
            router.push(redirectPath);
          }, 300);
        } else {
          router.push(redirectPath);
        }
      } else {
        console.log('登錄失敗，錯誤信息：', result.error);
        
        // 分析錯誤，提供更友好的提示
        if (result.error && result.error.toLowerCase().includes('password')) {
          error.value = '密碼不正確，請重試';
        } else if (result.error && result.error.toLowerCase().includes('email')) {
          error.value = '郵箱不存在或格式不正確';
        } else {
          error.value = result.error || '登錄失敗，請檢查郵箱和密碼';
        }
        
        // 嘗試登錄次數過多時的提示
        if (loginAttempts.value >= 3) {
          error.value += '。如果忘記密碼，請聯繫客服重置';
        }
      }
    }
  } catch (err) {
    console.error('登錄錯誤詳情:', err);
    console.log('錯誤狀態:', err.response?.status);
    console.log('錯誤數據:', err.response?.data);
    
    // 網絡錯誤處理
    if (err.message && err.message.includes('Network Error')) {
      error.value = '網絡連接失敗，請檢查您的網絡連接';
      console.log('網絡錯誤：無法連接到服務器');
    } else if (err.message && err.message.includes('timeout')) {
      error.value = '服務器響應超時，請稍後再試';
      console.log('超時錯誤：服務器響應時間過長');
    } else if (err.message && err.message.includes('Invalid API response')) {
      error.value = 'API響應格式錯誤，請聯系管理員';
      console.log('API錯誤：服務器返回的數據格式無效');
    } else if (err.response && err.response.status >= 500) {
      error.value = '服務器內部錯誤，請稍後再試';
      console.log('服務器錯誤：', err.response.status);
    } else {
      error.value = '登錄失敗，請稍後再試';
      console.log('其他錯誤：', err.message);
    }
    
    // 添加服務器地址和錯誤碼到控制台，幫助診斷
    console.log('API地址:', localStorage.getItem('api_base_url') || '(默認)');
    console.log('完整錯誤:', err);
  } finally {
    loading.value = false;
    console.log('==== 登錄流程結束 ====');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 140px);
  padding: 20px;
  background-color: var(--color-bg, #f9f9f9);
  transition: var(--theme-transition);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background-color: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0, 0, 0, 0.1));
  padding: 36px;
  transition: var(--theme-transition);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  transform: translateY(0);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.login-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px var(--shadow-color, rgba(0, 0, 0, 0.15));
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 28px;
  color: var(--text-primary, #333);
  transition: var(--theme-transition);
  background: linear-gradient(45deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-form {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--text-secondary, #555);
  transition: var(--theme-transition);
}

.form-group input {
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s ease;
  background-color: var(--color-bg, white);
  color: var(--text-primary, #333);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #3498db);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 52, 152, 219), 0.15);
}

.error-message {
  color: #e74c3c;
  margin-bottom: 20px;
  font-size: 14px;
  padding: 12px 16px;
  background-color: rgba(231, 76, 60, 0.1);
  border-radius: 8px;
  border-left: 3px solid #e74c3c;
}

.login-button {
  width: 100%;
  padding: 14px;
  background-color: var(--color-primary, #3498db);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.login-button::before {
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

.login-button:hover:not(:disabled)::before {
  opacity: 1;
}

.login-button:hover:not(:disabled) {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.4);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.login-button:disabled {
  background-color: var(--silver-gray, #95a5a6);
  cursor: not-allowed;
  box-shadow: none;
}

.loading-spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.login-footer {
  text-align: center;
  font-size: 15px;
  color: var(--text-secondary, #777);
  transition: var(--theme-transition);
  margin-top: 10px;
}

.login-footer a {
  color: var(--color-primary, #3498db);
  text-decoration: none;
  transition: var(--theme-transition);
  font-weight: 500;
  position: relative;
}

.login-footer a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -2px;
  left: 0;
  background-color: var(--color-primary, #3498db);
  transition: width 0.3s ease;
}

.login-footer a:hover::after {
  width: 100%;
}

.login-footer a:hover {
  text-decoration: none;
}
</style>