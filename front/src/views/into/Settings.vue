<template>
  <div class="settings-container">
    <div class="settings-header">
      <h1>我的設置</h1>
      <p>自定義您的個人偏好和應用設置</p>
    </div>
    
    <div v-if="loginError" class="login-error">
      <div class="error-message">
        <p>{{ loginError }}</p>
        <button @click="logout" class="logout-button">重新登錄</button>
      </div>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h2>主題設置</h2>
        <div class="setting-item">
          <div class="setting-label">深色模式</div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="darkMode" @change="toggleTheme">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="setting-description">切換深色模式以減少眼睛疲勞，適合夜間使用</div>
      </div>
      
      <div class="settings-section">
        <h2>通知設置</h2>
        <div class="setting-item">
          <div class="setting-label">電子郵件通知</div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="emailNotifications" @change="saveNotificationSettings">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="setting-description">接收關於賬戶活動和系統更新的電子郵件通知</div>
        
        <div class="setting-item">
          <div class="setting-label">系統通知</div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="systemNotifications" @change="saveNotificationSettings">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="setting-description">在應用內接收系統通知和提醒</div>
      </div>
      
      <div class="settings-section">
        <h2>語言設置</h2>
        <div class="setting-item">
          <div class="setting-label">界面語言</div>
          <div class="setting-control">
            <select v-model="language" @change="changeLanguage" class="language-select">
              <option value="zh-CN">簡體中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en-US">English</option>
            </select>
          </div>
        </div>
        <div class="setting-description">選擇您偏好的界面語言</div>
      </div>
      
      <div class="settings-section">
        <h2>隱私設置</h2>
        <div class="setting-item">
          <div class="setting-label">數據分析</div>
          <div class="setting-control">
            <label class="toggle-switch">
              <input type="checkbox" v-model="dataAnalytics" @change="savePrivacySettings">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="setting-description">允許收集匿名使用數據以改進服務</div>
      </div>
    </div>
    
    <div class="settings-actions">
      <button @click="resetSettings" class="reset-button">恢復默認設置</button>
      <button @click="saveAllSettings" class="save-button" :disabled="!settingsChanged">保存所有設置</button>
    </div>
  </div>
</template>

<script setup>
/**
 * 用戶設置頁面
 * 
 * 用於管理用戶偏好設置，包括主題、通知、語言和隱私設置
 */
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '../../stores/user';
import { useMessage } from '../../composables/message';

const userStore = useUserStore();
const { showSuccess, showError } = useMessage();
const loginError = ref(null);

// 设置状态
const darkMode = ref(false);
const emailNotifications = ref(true);
const systemNotifications = ref(true);
const language = ref('zh-CN');
const dataAnalytics = ref(true);

// 原始设置，用于检测变更
const originalSettings = ref({});

// 计算属性：检查设置是否已更改
const settingsChanged = computed(() => {
  return (
    darkMode.value !== originalSettings.value.darkMode ||
    emailNotifications.value !== originalSettings.value.emailNotifications ||
    systemNotifications.value !== originalSettings.value.systemNotifications ||
    language.value !== originalSettings.value.language ||
    dataAnalytics.value !== originalSettings.value.dataAnalytics
  );
});

// 初始化加载
onMounted(async () => {
  console.log('Settings组件挂载');
  
  try {
    // 如果Pinia store中没有用户信息，尝试加载
    if (!userStore.user) {
      console.log('加载用户信息...');
      await userStore.loadUser();
    }
    
    // 检查登录状态
    validateUserToken();
    
    // 加载用户设置
    loadUserSettings();
  } catch (error) {
    console.error('初始化用户设置失败:', error);
    loginError.value = '初始化用户信息失败，请重新登录';
  }
});

// 验证用户信息和token是否匹配
function validateUserToken() {
  const token = localStorage.getItem('token');
  const userJson = localStorage.getItem('user');
  
  if (!token) {
    console.warn('未找到token，需要重新登录');
    loginError.value = '登录状态已失效，请重新登录';
    return false;
  }
  
  if (!userJson) {
    console.warn('未找到用户信息，需要重新登录');
    loginError.value = '用户信息缺失，请重新登录';
    return false;
  }
  
  try {
    // 解析并验证用户信息
    const user = JSON.parse(userJson);
    if (!user || !user.id) {
      console.warn('用户信息不完整，缺少ID');
      loginError.value = '用户信息不完整，请重新登录';
      return false;
    }
    
    console.log('用户信息验证成功:', {
      id: user.id,
      username: user.username
    });
    return true;
  } catch (e) {
    console.error('解析用户信息失败:', e);
    loginError.value = '用户信息格式错误，请重新登录';
    return false;
  }
}

// 加载用户设置
function loadUserSettings() {
  // 从localStorage加载设置
  try {
    // 主题设置
    const savedTheme = localStorage.getItem('intoThemeDark');
    darkMode.value = savedTheme === 'true';
    
    // 通知设置
    const savedEmailNotifications = localStorage.getItem('emailNotifications');
    emailNotifications.value = savedEmailNotifications === null ? true : savedEmailNotifications === 'true';
    
    const savedSystemNotifications = localStorage.getItem('systemNotifications');
    systemNotifications.value = savedSystemNotifications === null ? true : savedSystemNotifications === 'true';
    
    // 语言设置
    const savedLanguage = localStorage.getItem('language');
    language.value = savedLanguage || 'zh-CN';
    
    // 隐私设置
    const savedDataAnalytics = localStorage.getItem('dataAnalytics');
    dataAnalytics.value = savedDataAnalytics === null ? true : savedDataAnalytics === 'true';
    
    // 保存原始设置用于比较
    originalSettings.value = {
      darkMode: darkMode.value,
      emailNotifications: emailNotifications.value,
      systemNotifications: systemNotifications.value,
      language: language.value,
      dataAnalytics: dataAnalytics.value
    };
    
    console.log('用户设置加载成功');
  } catch (error) {
    console.error('加载用户设置失败:', error);
    showError('加载设置失败');
  }
}

// 切换主题
function toggleTheme() {
  // 将主题偏好保存到localStorage
  localStorage.setItem('intoThemeDark', darkMode.value ? 'true' : 'false');
  
  // 通知父组件更新主题
  const event = new CustomEvent('theme-change', {
    detail: { darkMode: darkMode.value }
  });
  window.dispatchEvent(event);
}

// 保存通知设置
function saveNotificationSettings() {
  localStorage.setItem('emailNotifications', emailNotifications.value);
  localStorage.setItem('systemNotifications', systemNotifications.value);
}

// 更改语言
function changeLanguage() {
  localStorage.setItem('language', language.value);
  // 实际应用中可能需要刷新页面或通知应用更新语言
}

// 保存隐私设置
function savePrivacySettings() {
  localStorage.setItem('dataAnalytics', dataAnalytics.value);
}

// 保存所有设置
function saveAllSettings() {
  toggleTheme();
  saveNotificationSettings();
  changeLanguage();
  savePrivacySettings();
  
  // 更新原始设置
  originalSettings.value = {
    darkMode: darkMode.value,
    emailNotifications: emailNotifications.value,
    systemNotifications: systemNotifications.value,
    language: language.value,
    dataAnalytics: dataAnalytics.value
  };
  
  showSuccess('设置已保存');
}

// 重置设置
function resetSettings() {
  // 恢复默认值
  darkMode.value = false;
  emailNotifications.value = true;
  systemNotifications.value = true;
  language.value = 'zh-CN';
  dataAnalytics.value = true;
  
  // 保存默认设置
  saveAllSettings();
  
  showSuccess('已恢复默认设置');
}

// 登出
function logout() {
  userStore.logout();
  loginError.value = null;
}
</script>

<style scoped>
.settings-container {
  width: 100%;
  padding: 20px;
  color: var(--text-color);
  transition: var(--theme-transition);
}

.settings-header {
  text-align: center;
  margin-bottom: 50px;
  padding: 0 20px;
}

.settings-header h1 {
  font-size: 2.6rem;
  margin-bottom: 15px;
  color: var(--text-primary, #333);
  background: linear-gradient(45deg, var(--color-primary, #3498db), var(--color-primary-dark, #2980b9));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.settings-header p {
  color: var(--text-secondary, #666);
  font-size: 1.2rem;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-bottom: 40px;
}

.settings-section {
  background-color: var(--card-bg, white);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  transition: all 0.3s ease;
}

.settings-section:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px var(--shadow-color, rgba(0, 0, 0, 0.15));
}

h2 {
  font-size: 1.7rem;
  margin-bottom: 25px;
  color: var(--text-primary, #333);
  border-bottom: 1px solid var(--border-color, #eee);
  padding-bottom: 12px;
  font-weight: 600;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.setting-label {
  font-size: 1.1rem;
  font-weight: 500;
  color: var(--text-primary, #333);
}

.setting-description {
  color: var(--text-secondary, #666);
  font-size: 0.95rem;
  margin-bottom: 20px;
  padding-left: 2px;
}

/* 开关样式 */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 26px;
  width: 26px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--color-primary, #3498db);
}

input:focus + .toggle-slider {
  box-shadow: 0 0 1px var(--color-primary, #3498db);
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

/* 语言选择下拉框 */
.language-select {
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--card-bg, white);
  color: var(--text-primary, #333);
  font-size: 1rem;
  width: 150px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.language-select:hover {
  border-color: var(--color-primary, #3498db);
}

.language-select:focus {
  outline: none;
  border-color: var(--color-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

/* 按钮样式 */
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 20px;
}

.save-button, .reset-button {
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.save-button {
  background-color: var(--color-primary, #3498db);
  color: white;
  box-shadow: 0 4px 10px rgba(52, 152, 219, 0.3);
}

.save-button:hover {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(52, 152, 219, 0.4);
}

.save-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.reset-button {
  background-color: transparent;
  color: var(--text-secondary, #666);
  border: 1px solid var(--border-color, #ddd);
}

.reset-button:hover {
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.05));
  color: var(--text-primary, #333);
  transform: translateY(-2px);
}

/* 错误提示 */
.login-error {
  background-color: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.2);
  padding: 20px;
  margin-bottom: 30px;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(231, 76, 60, 0.1);
}

.error-message {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logout-button {
  background-color: var(--color-danger, #e74c3c);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(231, 76, 60, 0.2);
}

.logout-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .settings-container {
    padding: 15px;
  }
  
  .settings-header h1 {
    font-size: 2rem;
  }
  
  .settings-section {
    padding: 20px;
  }
  
  .setting-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .setting-control {
    align-self: flex-start;
  }
  
  .settings-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .save-button, .reset-button {
    width: 100%;
  }
}
</style>