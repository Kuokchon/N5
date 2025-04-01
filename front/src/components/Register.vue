<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">用户注册</h2>
      
      <form @submit.prevent="handleRegister" class="login-form">
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
          <label for="username">用户名 (选填)</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="请输入用户名，留空将使用邮箱前缀" 
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
        
        <div class="form-group">
          <label for="confirmPassword">确认密码</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            placeholder="请再次输入密码" 
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
          :disabled="loading || !email || !password || password !== confirmPassword"
        >
          <span v-if="loading" class="loading-spinner"></span>
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </form>
      
      <div class="login-footer">
        <p>已有账号？<router-link to="/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import store from '../services/store';

const email = ref('');
const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');
const router = useRouter();

const handleRegister = async () => {
  // 密碼驗證
  if (password.value !== confirmPassword.value) {
    error.value = '兩次輸入的密碼不一致';
    return;
  }
  
  // 密碼強度驗證
  if (password.value.length < 6) {
    error.value = '密碼長度至少需要6個字符';
    return;
  }
  
  console.log('==== 註冊流程開始 ====');
  console.log('註冊信息：', { 
    email: email.value, 
    username: username.value || email.value.split('@')[0], 
    password: '***' 
  });
  
  try {
    loading.value = true;
    error.value = '';
    
    // 使用email作為默認用戶名（如果未輸入）
    const effectiveUsername = username.value || email.value.split('@')[0];
    
    console.log('正在調用註冊API...');
    // 調用註冊API
    const result = await store.register(effectiveUsername, email.value, password.value);
    console.log('註冊API響應：', result);
    
    if (result.success) {
      console.log('註冊成功，正在跳轉到登錄頁面...');
      // 保存郵箱以便登錄頁面使用
      localStorage.setItem('lastLoginEmail', email.value);
      
      // 註冊成功後跳轉到登錄頁面
      router.push({
        path: '/login',
        query: { registered: 'true', email: email.value }
      });
    } else {
      error.value = result.error || '註冊失敗，請稍後重試';
      console.log('註冊失敗，錯誤：', result.error);
    }
  } catch (err) {
    console.error('註冊錯誤詳情：', err);
    
    // 提取API錯誤信息
    if (err.response && err.response.data) {
      const apiError = err.response.data.message || err.response.data.error;
      console.log('API錯誤：', apiError);
      
      // 處理常見錯誤
      if (apiError && apiError.toLowerCase().includes('email')) {
        error.value = '該郵箱已被註冊，請使用其他郵箱';
      } else if (apiError && apiError.toLowerCase().includes('username')) {
        error.value = '該用戶名已被使用，請選擇其他用戶名';
      } else {
        error.value = apiError || '註冊失敗，請稍後重試';
      }
    } else {
      error.value = err.message || '註冊失敗，請重試';
      console.log('其他錯誤：', err.message);
    }
  } finally {
    loading.value = false;
    console.log('==== 註冊流程結束 ====');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg, #f5f5f5);
  transition: var(--theme-transition);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px;
  background-color: var(--card-bg, white);
  border-radius: 12px;
  box-shadow: 0 8px 30px var(--shadow-color, rgba(0, 0, 0, 0.1));
  transition: var(--theme-transition);
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
}

.login-title {
  margin-bottom: 30px;
  text-align: center;
  color: var(--text-primary, #333);
  transition: var(--theme-transition);
  font-size: 1.8rem;
  font-weight: 600;
}

.login-form {
  margin-bottom: 25px;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary, #555);
  transition: var(--theme-transition);
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color, #ddd);
  border-radius: 8px;
  font-size: 15px;
  background-color: var(--color-bg, white);
  color: var(--text-primary, #333);
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #3498db);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb, 52, 152, 219), 0.15);
}

.error-message {
  margin-bottom: 20px;
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
  background-color: rgba(231, 76, 60, 0.1);
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid #e74c3c;
}

.login-button {
  width: 100%;
  padding: 14px;
  background-color: var(--color-primary, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
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
  background-color: var(--silver-gray, #ccc);
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
  to {
    transform: rotate(360deg);
  }
}

.login-footer {
  text-align: center;
  font-size: 15px;
  color: var(--text-secondary, #666);
  transition: var(--theme-transition);
  margin-top: 5px;
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