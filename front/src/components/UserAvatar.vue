<template>
  <div 
    class="user-avatar-container" 
    :class="{ 
      'clickable': clickable, 
      'uploadable': uploadable,
      'hover-effect': hoverEffect
    }"
    :style="{ width: `${size}px`, height: `${size}px` }"
    @click="handleClick"
  >
    <!-- 加載中 -->
    <div v-if="loading" class="loading-indicator">
      <div class="spinner"></div>
    </div>
    
    <!-- 用戶頭像 -->
    <img 
      v-else-if="avatarSrc" 
      :src="avatarSrc" 
      :alt="username || '用戶頭像'" 
      class="avatar-image"
      @error="handleImageError"
      @load="handleImageLoad"
    />
    
    <!-- 如果沒有頭像，顯示初始字母 -->
    <div v-else class="avatar-initial" :style="initialStyle">
      {{ initialLetter }}
    </div>
    
    <!-- 上傳覆蓋層 -->
    <div v-if="uploadable && !loading" class="upload-overlay" @click.stop="openFileSelector">
      <i class="fas fa-camera"></i>
      <span>更新</span>
    </div>
    
    <!-- 隱藏的文件輸入 -->
    <input
      v-if="uploadable"
      type="file"
      ref="fileInput"
      class="file-input"
      accept="image/*"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
/**
 * UserAvatar.vue - 用户头像组件
 * 
 * 该组件负责显示用户头像，支持不同尺寸、交互选项和上传功能
 * 可在用户登录后显示头像，未登录或加载失败时显示首字母
 * 支持点击跳转到用户资料页面
 */
import { ref, computed, onMounted, watch } from 'vue';
import { useUserStore } from '../stores/user';
import { userApi } from '../services/api';

const props = defineProps({
  username: {
    type: String,
    default: ''
  },
  userId: {
    type: [String, Number],
    default: ''
  },
  size: {
    type: Number,
    default: 40
  },
  clickable: {
    type: Boolean,
    default: true
  },
  uploadable: {
    type: Boolean,
    default: false
  },
  hoverEffect: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['click', 'upload', 'error']);

const userStore = useUserStore();

const loading = ref(false);
const fileInput = ref(null);
const avatarError = ref(false);
const hasError = ref(false);
const imageLoaded = ref(false);

const avatarSrc = computed(() => {
  if (hasError.value) {
    // 如果已经有错误，返回基于用户名的默认头像处理方式
    return null; // 返回null会触发使用初始字母的头像
  }
  
  if (props.src) return props.src;
  
  // 获取用户ID
  const userId = props.userId || userStore.user?.id;
  
  if (!userId) {
    // 没有用户ID时，使用初始字母头像
    console.log('没有用户ID，使用初始字母头像');
    return null;
  }
  
  // 使用API工具中的方法获取正确的URL
  try {
    // 如果设置了本地头像模式，直接返回null使用字母头像
    if (localStorage.getItem('use_local_avatar') === 'true') {
      console.log('已启用本地头像模式，使用初始字母头像');
      return null;
    }

    const url = userApi.getUserAvatarUrl(userId);
    console.log(`获取用户 ${userId} 的头像URL:`, url);
    return url;
  } catch (error) {
    console.warn('無法獲取用戶頭像URL:', error);
    return null; // 使用初始字母头像
  }
});

const initialLetter = computed(() => {
  const username = props.username || '用戶';
  return username.charAt(0);
});

const initialStyle = computed(() => {
  if (props.color) {
    return { backgroundColor: props.color };
  }
  
  const username = props.username || '';
  const colors = [
    '#4A90E2', '#50E3C2', '#F5A623', '#D0021B', 
    '#7ED321', '#9013FE', '#417505', '#BD10E0'
  ];
  
  const index = username.length > 0 
    ? username.charCodeAt(0) % colors.length 
    : 0;
  
  return { backgroundColor: colors[index] };
});

watch(() => props.size, (newSize) => {
  document.documentElement.style.setProperty('--size', newSize);
});

onMounted(() => {
  document.documentElement.style.setProperty('--size', props.size);
  
  // 重置加载状态
  hasError.value = false;
  imageLoaded.value = false;
  
  // 在组件挂载后添加全局错误处理
  window.addEventListener('error', (e) => {
    // 检查是否是图片加载错误
    if (e.target && e.target.tagName === 'IMG') {
      console.warn('捕获全局图片加载错误', e);
      // 可以在这里添加额外的处理逻辑
    }
  }, true);
});

// 處理點擊事件
const handleClick = () => {
  if (props.clickable) {
    emit('click');
  }
};

// 打開文件選擇器
const openFileSelector = (e) => {
  if (props.uploadable && fileInput.value) {
    fileInput.value.click();
  }
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('請選擇有效的圖片文件 (JPEG, PNG, GIF, WEBP)');
    return;
  }
  
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('圖片大小不能超過5MB');
    return;
  }
  
  const formData = new FormData();
  formData.append('avatar', file);
  formData.append('timestamp', Date.now().toString()); // 添加时间戳避免缓存问题
  
  // 调试日志
  console.log('文件类型:', file.type);
  console.log('文件大小:', file.size, 'bytes');
  console.log('当前用户Store:', userStore.isLoggedIn ? '已登录' : '未登录');
  
  // 检查用户登录状态
  if (!userStore.isLoggedIn) {
    alert('您需要先登录才能上传头像');
    emit('error', new Error('未登录状态无法上传头像'));
    return;
  }
  
  // 从store和props中获取用户ID
  const storeUserId = userStore.user && userStore.user.id;
  const propsUserId = props.userId;
  console.log('用户ID比较:');
  console.log('- props中的用户ID:', propsUserId);
  console.log('- store中的用户ID:', storeUserId);
  
  // 检查这是否是当前用户的头像上传
  let canUpload = true;
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const localUser = JSON.parse(userJson);
      console.log('- localStorage中的用户ID:', localUser.id);
      
      // ID匹配检查 (转换为字符串进行比较，避免类型不匹配)
      const localUserId = String(localUser.id);
      const propId = String(props.userId);
      
      if (propId && localUserId !== propId) {
        console.warn('警告: 试图上传的用户ID与当前登录用户不匹配');
        console.warn(`props用户ID: ${propId}, 登录用户ID: ${localUserId}`);
        
        // 如果不是本人，不允许上传
        if (confirm('您似乎正在尝试上传其他用户的头像，这可能导致权限错误。请确认您是否已正确登录？')) {
          // 用户确认继续
          console.log('用户确认继续上传，尽管ID不匹配');
          // 使用localStorage中的ID，而不是props中的ID
          formData.append('userId', localUserId);
        } else {
          canUpload = false;
          console.log('用户取消上传');
          return;
        }
      } else {
        console.log('ID匹配: 正在上传当前登录用户的头像');
        formData.append('userId', localUserId);
      }
    } else {
      console.log('localStorage中没有用户信息，可能需要重新登录');
      alert('无法验证您的身份，请重新登录');
      emit('error', new Error('用户身份验证失败'));
      return;
    }
  } catch (e) {
    console.error('解析localStorage用户数据失败:', e);
    alert('用户信息验证失败，请重新登录');
    emit('error', e);
    return;
  }
  
  if (!canUpload) return;
  
  // 检查localStorage中的token是否存在
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('未找到授权令牌');
    alert('登录状态已过期，请重新登录');
    emit('error', new Error('未找到授权令牌'));
    return;
  }
  
  // 检查FormData内容
  let debugFormData = '';
  for (let pair of formData.entries()) {
    debugFormData += `${pair[0]}: ${pair[1].name || pair[1]}\n`;
  }
  console.log('FormData内容:', debugFormData);
  
  loading.value = true;
  
  try {
    emit('upload', { formData });
    
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (error) {
    console.error('頭像上傳出錯:', error);
    emit('error', error);
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 500);
  }
};

const handleImageError = (e) => {
  console.warn('頭像圖片加載失敗', e);
  
  // 记录加载失败的URL
  const failedUrl = e.target.src;
  console.log('加载失败的URL:', failedUrl);
  
  // 启用本地头像模式，避免重复请求失败的图片
  localStorage.setItem('use_local_avatar', 'true');
  
  // 设置hasError标志，显示初始字母头像
  hasError.value = true;
  
  // 重置src，使用基于名字的头像
  if (e.target) {
    e.target.style.display = 'none'; // 隐藏失败的图片
  }

  // 通知父组件发生了错误
  emit('error', new Error('頭像圖片加載失敗'));
};

const handleImageLoad = (e) => {
  imageLoaded.value = true;
  hasError.value = false; // 重置错误状态
  localStorage.removeItem('use_local_avatar'); // 清除本地头像模式标记
  console.log('頭像圖片加載成功');
  
  // 确保图片正常显示
  if (e && e.target) {
    e.target.style.display = 'block';
  }
};

defineExpose({
  setLoading(state) {
    loading.value = state;
  },
  triggerUpload() {
    if (props.uploadable && fileInput.value) {
      fileInput.value.click();
    }
  }
});
</script>

<style scoped>
.user-avatar-container {
  position: relative;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--avatar-bg, #e0e0e0);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.clickable {
  cursor: pointer;
}

.hover-effect:hover {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.avatar-initial {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
  font-size: calc(var(--size, 40) * 0.4px);
  background-color: var(--avatar-color, #4A90E2);
}

.upload-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.upload-overlay i {
  font-size: calc(var(--size, 40) * 0.3px);
  margin-bottom: 5px;
}

.upload-overlay span {
  font-size: calc(var(--size, 40) * 0.2px);
  font-weight: 500;
}

.user-avatar-container:hover .upload-overlay {
  opacity: 1;
}

.file-input {
  display: none;
}

.loading-indicator {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.1);
}

.spinner {
  width: 60%;
  height: 60%;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--spinner-color, #4A90E2);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

:global(.dark) .avatar-initial {
  background-color: var(--avatar-color-dark, #2a2a2a);
}

:global(.dark) .spinner {
  border-top-color: var(--spinner-color-dark, #4A90E2);
}
</style> 