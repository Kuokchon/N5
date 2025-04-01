<template>
  <div class="user-profile-container">
    <div class="profile-header">
      <h1>個人資料</h1>
      <p>管理您的個人信息和頭像</p>
    </div>
    
    <div v-if="loginError" class="login-error">
      <div class="error-message">
        <p>{{ loginError }}</p>
        <button @click="logout" class="logout-button">重新登錄</button>
      </div>
    </div>
    
    <div class="profile-content">
      <div class="avatar-section">
        <h2>頭像設置</h2>
        <div class="avatar-wrapper">
          <UserAvatar 
            :userId="userId"
            :username="userStore.username"
            size="xl"
            clickable
            uploadable
            @upload="handleAvatarUpload"
            @error="handleAvatarError"
          />
        </div>
        <div class="avatar-info">
          <p>點擊頭像可以更換</p>
          <p class="hint">支持JPG、PNG、WebP格式，最大2MB</p>
        </div>
        
        <div class="bio-section">
          <h3>個人簡介</h3>
          <textarea 
            v-model="userBio" 
            class="bio-textarea" 
            placeholder="請輸入您的個人簡介..."
            maxlength="200"
          ></textarea>
          <div class="bio-counter">{{ userBio.length }}/200</div>
          <button 
            class="save-button" 
            @click="saveUserBio"
            :disabled="bioSaving"
          >
            {{ bioSaving ? '保存中...' : '保存簡介' }}
          </button>
        </div>
      </div>
      
      <div class="user-info-section">
        <h2>基本信息</h2>
        <div class="info-item">
          <label>用戶名</label>
          <div class="info-value-with-action">
            <span>{{ userStore.username }}</span>
            <button class="action-button edit-button" @click="showEditUsernameModal">
              <i class="fas fa-edit"></i> 修改
            </button>
          </div>
        </div>
        <div class="info-item">
          <label>密碼</label>
          <div class="info-value-with-action">
            <span>{{ hidePassword ? '••••••••' : userPassword }}</span>
            <div class="action-buttons">
              <button class="action-button toggle-button" @click="togglePasswordVisibility">
                <i :class="hidePassword ? 'fas fa-eye' : 'fas fa-eye-slash'"></i>
              </button>
              <button class="action-button edit-button" @click="showEditPasswordModal">
                <i class="fas fa-edit"></i> 修改
              </button>
            </div>
          </div>
        </div>
        <div class="info-item">
          <label>郵箱</label>
          <div>{{ userStore.user?.email || '未設置' }}</div>
        </div>
        <div class="info-item">
          <label>手機號碼</label>
          <div class="info-value-with-action">
            <span>{{ userStore.user?.phone || '未綁定' }}</span>
            <button v-if="!userStore.user?.phone" class="action-button bind-button" @click="showBindPhoneModal">
              <i class="fas fa-link"></i> 綁定
            </button>
          </div>
        </div>
        <div class="info-item">
          <label>微信</label>
          <div class="info-value-with-action">
            <span>{{ userStore.user?.wechat || '未綁定' }}</span>
            <button v-if="!userStore.user?.wechat" class="action-button bind-button" @click="showBindWechatModal">
              <i class="fas fa-link"></i> 綁定
            </button>
          </div>
        </div>
        <div class="info-item">
          <label>註冊時間</label>
          <div>{{ formatDate(userStore.user?.created_at) }}</div>
        </div>
      </div>
    </div>
    
    <div v-if="showHistory" class="avatar-history-section">
      <h2>頭像歷史</h2>
      <div v-if="avatarHistory.length > 0" class="history-list">
        <div v-for="item in avatarHistory" :key="item.created_at" class="history-item">
          <img :src="item.avatar_url" :alt="`頭像 ${formatDate(item.created_at)}`" class="history-avatar" />
          <div class="history-date">{{ formatDate(item.created_at) }}</div>
        </div>
      </div>
      <div v-else class="empty-history">
        <p>暫無歷史頭像記錄</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * 用戶資料頁面
 * 
 * 用於展示和管理用戶基本信息和頭像
 */
import { ref, onMounted } from 'vue';
import { useUserStore } from '../../stores/user';
import UserAvatar from '../../components/UserAvatar.vue';
import { useMessage } from '../../composables/message';
import axios from 'axios';

// 引入Font Awesome图标 - 注意：实际项目中需要确保已安装@fortawesome/fontawesome-free包
// 如果项目中没有安装，可以通过CDN方式引入或者使用其他图标库

const userStore = useUserStore();
const { showError, showSuccess } = useMessage();
const avatarRef = ref(null);
const avatarHistory = ref([]);
const showHistory = ref(false);
const loginError = ref(null);
const userId = ref(null);

// 新增的状态变量
const userBio = ref('');
const bioSaving = ref(false);
const userPassword = ref('password123'); // 模拟密码，实际应用中不应该这样处理
const hidePassword = ref(true);

// 模态框状态
const showUsernameModal = ref(false);
const showPasswordModal = ref(false);
const showPhoneModal = ref(false);
const showWechatModal = ref(false);

// 初始化加载
onMounted(async () => {
  console.log('UserProfile组件挂载');
  
  try {
    // 先清除可能引起问题的本地缓存
    localStorage.removeItem('use_local_avatar');
    
    // 从本地存储初始化用户ID
    initUserIdFromLocalStorage();
    
    // 如果Pinia store中没有用户信息，尝试加载
    if (!userStore.user) {
      console.log('加载用户信息...');
      await userStore.loadUser();
      
      // 再次设置用户ID，这次从store获取
      setUserId();
    } else {
      // 已有用户信息，直接使用store中的ID
      userId.value = userStore.user.id;
      console.log('使用store中的用户ID:', userId.value);
    }
    
    // 检查localStorage中的user信息和token是否匹配
    validateUserToken();
    
    // 加载用户简介
    if (userStore.user && userStore.user.bio) {
      userBio.value = userStore.user.bio;
      console.log('加载用户简介:', userBio.value);
    }
    
    // 加载头像历史
    try {
      await loadAvatarHistory();
    } catch (error) {
      console.error('加载头像历史失败:', error);
    }
  } catch (error) {
    console.error('初始化用户信息失败:', error);
    loginError.value = '初始化用户信息失败，请重新登录';
  }
});

// 从localStorage初始化用户ID
function initUserIdFromLocalStorage() {
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user && user.id) {
        userId.value = user.id;
        console.log('初始化时从localStorage设置用户ID:', userId.value);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.error('从localStorage初始化用户ID失败:', e);
    return false;
  }
}

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

// 设置用户ID
function setUserId() {
  // 从store获取ID
  if (userStore.user && userStore.user.id) {
    userId.value = userStore.user.id;
    console.log('从store设置用户ID:', userId.value);
    return;
  }
  
  // 如果store中没有，尝试从localStorage获取
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user && user.id) {
        userId.value = user.id;
        console.log('从localStorage设置用户ID:', userId.value);
        return;
      }
    }
  } catch (e) {
    console.error('解析localStorage用户数据失败:', e);
  }
  
  // 如果都没有，显示错误
  console.error('无法获取用户ID');
  loginError.value = '无法获取用户信息，请重新登录';
}

// 加载头像历史
async function loadAvatarHistory() {
  if (!userStore.isLoggedIn || !userStore.user) return;
  
  const userId = userStore.user.id;
  if (!userId) {
    console.warn('无法加载头像历史: 用户ID不存在');
    return;
  }
  
  try {
    console.log('获取头像历史，用户ID:', userId);
    const response = await axios.get(`/api/users/${userId}/avatar/history`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.data.success) {
      avatarHistory.value = response.data.data.items;
      showHistory.value = avatarHistory.value.length > 0;
    }
  } catch (error) {
    console.error('获取头像历史失败:', error);
    showHistory.value = false;
  }
}

// 处理头像上传
async function handleAvatarUpload({ formData }) {
  console.log('头像上传 - 准备上传', formData);
  console.log('当前用户状态:', userStore.user);
  console.log('用户ID:', userStore.user?.id);
  
  // 检查localStorage中的用户信息
  try {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('localStorage中的用户:', storedUser);
    console.log('localStorage中的用户ID:', storedUser.id);
  } catch (e) {
    console.error('解析localStorage用户失败:', e);
  }
  
  const success = await userStore.uploadAvatar(formData);
  
  if (success) {
    // 重新加载头像历史
    await loadAvatarHistory();
  }
}

// 手动触发头像上传
function triggerAvatarUpload() {
  // 获取UserAvatar组件实例并调用其内部方法
  const avatarComponent = document.querySelector('.avatar-wrapper .user-avatar');
  if (avatarComponent) {
    // 模拟点击头像
    avatarComponent.click();
  }
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 处理头像错误
function handleAvatarError(error) {
  console.error('头像错误:', error);
  
  // 检查已登录状态
  if (!userStore.isLoggedIn) {
    loginError.value = '登录状态失效，请重新登录';
    return;
  }
  
  // 检查是图片加载错误还是上传错误
  if (error.message === '頭像圖片加載失敗') {
    // 设置为使用基于用户名的字母头像，不影响用户体验
    console.log('使用基于用户名的字母头像替代');
    localStorage.setItem('use_local_avatar', 'true');
  } else {
    // 其他类型的错误，可能是权限问题
    loginError.value = '获取用户头像失败，请尝试重新登录';
  }
}

// 保存用户简介
async function saveUserBio() {
  if (bioSaving.value) return;
  
  bioSaving.value = true;
  try {
    // 调用API保存用户简介
    const { userProfileApi } = await import('../../services/userProfileApi');
    await userProfileApi.updateBio(userBio.value);
    
    showSuccess('個人簡介保存成功');
  } catch (error) {
    console.error('保存个人简介失败:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('保存個人簡介失敗，請稍後重試');
    }
  } finally {
    bioSaving.value = false;
  }
}

// 切换密码可见性
function togglePasswordVisibility() {
  hidePassword.value = !hidePassword.value;
}

// 显示修改用户名模态框
function showEditUsernameModal() {
  showUsernameModal.value = true;
  // 实际应用中这里应该打开一个模态框
  alert('修改用戶名功能即將上線');
}

// 显示修改密码模态框
function showEditPasswordModal() {
  showPasswordModal.value = true;
  // 创建一个简单的模态框来修改密码
  const currentPassword = prompt('請輸入當前密碼:');
  if (!currentPassword) return;
  
  const newPassword = prompt('請輸入新密碼 (至少6個字符):');
  if (!newPassword) return;
  
  if (newPassword.length < 6) {
    showError('新密碼長度不能少於6個字符');
    return;
  }
  
  // 调用API修改密码
  updatePassword(currentPassword, newPassword);
}

// 更新密码
async function updatePassword(currentPassword, newPassword) {
  try {
    const { userProfileApi } = await import('../../services/userProfileApi');
    await userProfileApi.updatePassword(currentPassword, newPassword);
    
    showSuccess('密碼修改成功');
    // 更新显示的密码（实际应用中不应该这样处理密码）
    userPassword.value = newPassword;
    hidePassword.value = true;
  } catch (error) {
    console.error('修改密码失败:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('修改密碼失敗，請稍後重試');
    }
  }
}

// 显示绑定手机号模态框
function showBindPhoneModal() {
  showPhoneModal.value = true;
  // 创建一个简单的模态框来绑定手机号
  const phone = prompt('請輸入您的手機號碼:');
  if (!phone) return;
  
  // 简单验证手机号格式
  if (!/^\d{11}$/.test(phone)) {
    showError('請輸入有效的11位手機號碼');
    return;
  }
  
  // 调用API绑定手机号
  bindPhone(phone);
}

// 绑定手机号
async function bindPhone(phone) {
  try {
    const { userProfileApi } = await import('../../services/userProfileApi');
    const result = await userProfileApi.bindPhone(phone);
    
    showSuccess('手機號綁定成功');
    
    // 更新用户信息
    if (userStore.user) {
      userStore.user.phone = phone;
    }
    
    // 重新加载用户信息
    await userStore.loadUser(true);
  } catch (error) {
    console.error('绑定手机号失败:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('綁定手機號失敗，請稍後重試');
    }
  }
}

// 显示绑定微信模态框
function showBindWechatModal() {
  showWechatModal.value = true;
  // 创建一个简单的模态框来绑定微信
  const wechat = prompt('請輸入您的微信賬號:');
  if (!wechat) return;
  
  // 简单验证微信账号格式
  if (wechat.length < 3) {
    showError('微信賬號太短，請輸入有效的微信賬號');
    return;
  }
  
  // 调用API绑定微信
  bindWechat(wechat);
}

// 绑定微信
async function bindWechat(wechat) {
  try {
    const { userProfileApi } = await import('../../services/userProfileApi');
    const result = await userProfileApi.bindWechat(wechat);
    
    showSuccess('微信賬號綁定成功');
    
    // 更新用户信息
    if (userStore.user) {
      userStore.user.wechat = wechat;
    }
    
    // 重新加载用户信息
    await userStore.loadUser(true);
  } catch (error) {
    console.error('绑定微信账号失败:', error);
    if (error.response && error.response.data && error.response.data.message) {
      showError(error.response.data.message);
    } else {
      showError('綁定微信賬號失敗，請稍後重試');
    }
  }
}

// 登出
function logout() {
  userStore.logout();
  loginError.value = null;
}
</script>

<style scoped>
.user-profile-container {
  width: 100%;
  padding: 20px;
  color: var(--text-color);
  transition: var(--theme-transition);
}

/* 新增样式 */
.bio-section {
  margin-top: 25px;
}

.bio-section h3 {
  font-size: 1.3rem;
  margin-bottom: 15px;
  color: var(--text-primary, #333);
  font-weight: 600;
}

.bio-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--border-color, #ddd);
  background-color: var(--input-bg, white);
  color: var(--text-primary, #333);
  font-size: 1rem;
  resize: vertical;
  transition: all 0.3s ease;
  margin-bottom: 10px;
}

.bio-textarea:focus {
  outline: none;
  border-color: var(--color-primary, #3498db);
  box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 52, 152, 219), 0.2);
}

.bio-counter {
  text-align: right;
  font-size: 0.85rem;
  color: var(--text-secondary, #666);
  margin-bottom: 15px;
}

.save-button {
  background-color: var(--color-primary, #3498db);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
  width: 100%;
}

.save-button::before {
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

.save-button:hover::before {
  opacity: 1;
}

.save-button:hover {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.4);
}

.save-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.save-button:disabled {
  background-color: var(--silver-gray, #ccc);
  cursor: not-allowed;
  box-shadow: none;
}

.info-value-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.2rem;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color, #eee);
  color: var(--text-primary, #333);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.edit-button {
  color: var(--color-primary, #3498db);
}

.edit-button:hover {
  background-color: rgba(var(--color-primary-rgb, 52, 152, 219), 0.1);
}

.toggle-button {
  color: var(--text-secondary, #666);
  padding: 5px 8px;
}

.toggle-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.bind-button {
  color: var(--color-success, #2ecc71);
}

.bind-button:hover {
  background-color: rgba(46, 204, 113, 0.1);
}

.profile-header {
  text-align: center;
  margin-bottom: 50px;
  padding: 0 20px;
}

.profile-header h1 {
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

.profile-header p {
  color: var(--text-secondary, #666);
  font-size: 1.2rem;
  opacity: 0.8;
  max-width: 600px;
  margin: 0 auto;
}

.profile-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 40px;
  margin-bottom: 50px;
  transition: var(--theme-transition);
}

.avatar-section,
.user-info-section,
.avatar-history-section {
  background-color: var(--card-bg, white);
  border-radius: 16px;
  padding: 30px;
  box-shadow: 0 10px 30px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, rgba(0, 0, 0, 0.05));
  transition: all 0.3s ease;
}

.avatar-section:hover,
.user-info-section:hover,
.avatar-history-section:hover {
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
  transition: var(--theme-transition);
}

.avatar-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
}

.avatar-wrapper:hover {
  transform: scale(1.05);
}

.avatar-info {
  text-align: center;
  color: var(--text-secondary, #666);
  transition: var(--theme-transition);
}

.hint {
  font-size: 0.9rem;
  color: var(--text-secondary, #999);
  margin: 10px 0 20px;
  font-style: italic;
}

.upload-button {
  background-color: var(--color-primary, #3498db);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.upload-button::before {
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

.upload-button:hover::before {
  opacity: 1;
}

.upload-button:hover {
  background-color: var(--color-primary-dark, #2980b9);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(var(--color-primary-rgb, 52, 152, 219), 0.4);
}

.upload-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 8px rgba(var(--color-primary-rgb, 52, 152, 219), 0.3);
}

.upload-button:disabled {
  background-color: var(--silver-gray, #ccc);
  cursor: not-allowed;
  box-shadow: none;
}

.upload-button:disabled::before {
  display: none;
}

.info-item {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  transition: var(--theme-transition);
}

.info-item label {
  font-size: 1rem;
  color: var(--text-secondary, #666);
  margin-bottom: 8px;
  font-weight: 500;
}

.info-item div {
  font-size: 1.2rem;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color, #eee);
  color: var(--text-primary, #333);
  font-weight: 500;
}

.avatar-history-section {
  margin-top: 40px;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.history-item {
  text-align: center;
  transition: all 0.3s ease;
  padding: 10px;
  border-radius: 12px;
}

.history-item:hover {
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.03));
  transform: translateY(-5px);
  box-shadow: 0 8px 20px var(--shadow-color, rgba(0, 0, 0, 0.1));
}

.history-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border-color, #eee);
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px var(--shadow-color, rgba(0, 0, 0, 0.1));
}

.history-item:hover .history-avatar {
  border-color: var(--color-primary, #3498db);
  transform: scale(1.05);
}

.history-date {
  font-size: 0.9rem;
  color: var(--text-secondary, #666);
  margin-top: 8px;
  font-weight: 500;
}

.empty-history {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary, #666);
  background-color: var(--hover-bg, rgba(0, 0, 0, 0.02));
  border-radius: 12px;
  border: 1px dashed var(--border-color, rgba(0, 0, 0, 0.1));
  font-style: italic;
  font-size: 1.1rem;
}

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
  position: relative;
  overflow: hidden;
}

.logout-button::before {
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

.logout-button:hover::before {
  opacity: 1;
}

.logout-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(231, 76, 60, 0.3);
}

@media (max-width: 768px) {
  .profile-content {
    grid-template-columns: 1fr;
  }
  
  .user-profile-container {
    padding: 20px;
  }
}
</style>