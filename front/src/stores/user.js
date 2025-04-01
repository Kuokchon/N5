/**
 * 用户状态管理
 * 
 * 提供用户信息和头像管理功能
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useMessage } from '../composables/message'
import axios from 'axios'
import { apiBaseUrl, authAPI, userApi } from '../services/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const avatarLoading = ref(false)
  const { showSuccess, showError } = useMessage()
  const retryCount = ref(0)
  const maxRetries = 3

  // 获取认证头信息
  const getAuthHeader = () => {
    const token = localStorage.getItem('token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  // 获取API基础URL
  const getApiBaseUrl = () => {
    // 使用固定API路徑
    return 'http://localhost:3000';
  }

  // 加载用户信息
  const loadUser = async (forceReload = false) => {
    // 如果已經加載過且不需要強制重新加載，直接返回
    if (loading.value) return
    if (user.value && !forceReload) return user.value
    
    loading.value = true
    error.value = null
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        user.value = null
        return null
      }
      
      console.log('嘗試加載用戶數據')
      
      // 使用封裝的API服務獲取用戶信息
      console.log('正在獲取用戶信息...')
      let userResponse
      
      try {
        // 使用固定API路徑獲取用戶數據
        userResponse = await authAPI.getCurrentUser()
        console.log('獲取用戶數據成功:', userResponse)
      } catch (apiErr) {
        console.error('API調用失敗:', apiErr)
        
        // 嘗試使用直接獲取方式作為備份
        try {
          console.log('嘗試使用備用方式獲取用戶數據...')
          const response = await axios.get('http://localhost:3000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          
          if (response.data) {
            userResponse = {
              user: response.data.user || response.data.data || response.data
            }
            console.log('備用方式獲取成功:', userResponse)
          }
        } catch (backupError) {
          console.error('備用方法也失敗:', backupError)
          throw apiErr // 重新拋出原始錯誤
        }
      }
      
      if (userResponse && userResponse.user) {
        user.value = userResponse.user
        
        // 確保用戶數據包含必要字段
        if (!user.value.id && user.value.userId) {
          user.value.id = user.value.userId
        }
        if (!user.value.id && user.value._id) {
          user.value.id = user.value._id
        }
        
        // 確保avatar_url字段存在
        if (!user.value.avatar_url && user.value.avatarUrl) {
          user.value.avatar_url = user.value.avatarUrl
        }
        
        // 確保管理員字段存在
        if (user.value.is_admin === undefined) {
          // 如果服務器返回的數據中沒有is_admin字段，設置為默認值false
          user.value.is_admin = false;
        }
        
        // 如果有admin_role字段，但沒有is_admin字段，則設置is_admin為true
        if (user.value.admin_role && user.value.is_admin === undefined) {
          user.value.is_admin = true;
        }
        
        // 緩存用戶數據，以便API不可用時使用
        try {
          localStorage.setItem('user_cache', JSON.stringify(user.value));
        } catch (e) {
          console.warn('緩存用戶數據失敗:', e);
        }
        
        console.log('成功獲取用戶數據:', user.value)
        return user.value
      } else {
        console.error('未獲取到有效的用戶數據:', userResponse)
        throw new Error('API返回的用戶數據無效')
      }
    } catch (err) {
      console.error('加载用户信息失败:', err)
      
      // 詳細記錄錯誤信息
      if (err.response) {
        console.log('錯誤響應狀態:', err.response.status)
        console.log('錯誤響應數據:', err.response.data)
        
        // 如果服務器返回了明確的錯誤信息，使用該信息
        if (err.response.data && err.response.data.message) {
          error.value = err.response.data.message
        } else {
          error.value = `服務器錯誤 (${err.response.status})`
        }
      } else if (err.request) {
        console.log('請求發送但未收到響應')
        error.value = '無法連接到服務器，請檢查網絡連接'
      } else {
        console.log('請求設置錯誤或API服務異常:', err.message)
        error.value = err.message || '加载用户信息失败'
      }
      
      // 如果是401错误，清除token
      if (err.response && err.response.status === 401) {
        console.log('身份驗證失敗，清除token')
        localStorage.removeItem('token')
        user.value = null
      }
      
      // 輸出API基礎URL，幫助診斷問題
      console.log('當前API基礎URL:', getApiBaseUrl())
      
      // 自動重試（網絡錯誤或超時錯誤或服务器錯誤）
      if (retryCount.value < maxRetries && 
          (!err.response || err.response.status >= 500 || err.code === 'ECONNABORTED')) {
        retryCount.value++
        console.log(`網絡或服務器錯誤，第${retryCount.value}次重試...`)
        
        // 延遲重試，每次增加延遲
        const delay = 1000 * retryCount.value
        await new Promise(resolve => setTimeout(resolve, delay))
        
        loading.value = false
        return loadUser(true) // 遞歸調用，強制重新加載
      }
      
      // 所有重試都失敗，返回null
      return null
    } finally {
      loading.value = false
    }
  }

  // 上传用户头像
  const uploadAvatar = async (formData) => {
    if (avatarLoading.value) {
      console.warn('头像正在上传中，请等待当前上传完成');
      return false;
    }
    
    // 检查用户登录状态
    if (!user.value) {
      console.error('用户未登录，无法上传头像');
      showError('请先登录再上传头像');
      return false;
    }
    
    // 验证用户ID
    if (!user.value.id) {
      console.error('用户ID不存在，无法上传头像');
      showError('用户信息不完整，请重新登录');
      return false;
    }
    
    avatarLoading.value = true;
    let success = false;
    
    try {
      // 從formData中获取文件
      let avatarFile = null;
      try {
        for (let pair of formData.entries()) {
          if (pair[0] === 'avatar') {
            avatarFile = pair[1];
            break;
          }
        }
      } catch (e) {
        console.log('無法從FormData獲取文件:', e);
      }
      
      if (!avatarFile) {
        throw new Error('表單中沒有找到頭像文件');
      }
      
      console.log('上傳頭像，用戶數據:', {
        id: user.value.id,
        username: user.value.username
      });
      
      // 使用API模块上传头像，传递原始FormData而不是重新创建
      try {
        console.log('调用API上传头像，用户ID:', user.value.id);
        
        // 直接调用API，只传递文件参数
        const response = await userApi.uploadAvatar(null, avatarFile);
        
        // 处理不同格式的响应
        const responseData = response.data || response;
        console.log('上传成功，响应数据:', responseData);
        
        // 提取头像URL
        let avatarUrl = null;
        if (responseData.success && responseData.data && responseData.data.avatar_url) {
          avatarUrl = responseData.data.avatar_url;
        } else if (responseData.avatarUrl) {
          avatarUrl = responseData.avatarUrl;
        } else if (responseData.avatar_url) {
          avatarUrl = responseData.avatar_url;
        } else if (responseData.user && responseData.user.avatar_url) {
          avatarUrl = responseData.user.avatar_url;
        }
        
        if (avatarUrl) {
          // 更新用户头像URL
          user.value.avatar_url = avatarUrl;
          user.value.avatarUrl = avatarUrl; // 兼容不同的API响应格式
          
          // 更新本地缓存
          localStorage.setItem('user_cache', JSON.stringify(user.value));
          localStorage.removeItem('use_local_avatar'); // 清除本地头像标识
          
          showSuccess('頭像上傳成功');
          success = true;
        } else {
          console.warn('上传成功但未获取到URL:', responseData);
          showError('頭像上傳成功但未獲取到URL');
        }
      } catch (error) {
        console.error('頭像上傳失敗:', error);
        
        if (error.response) {
          console.log('上傳錯誤狀態:', error.response.status);
          console.log('上傳錯誤數據:', error.response.data);
          
          if (error.response.status === 403) {
            console.error('权限错误，用户ID不匹配或无权限');
            showError('無權上傳頭像，請重新登錄後再試');
            return false;
          }
          
          // 提供具體的錯誤信息
          const errorMessage = error.response.data?.message || `上傳失敗 (${error.response.status})`;
          showError(errorMessage);
        } else {
          showError('網絡錯誤，無法上傳頭像');
        }
      }
      
      return success;
    } finally {
      avatarLoading.value = false;
    }
  }

  // 登出
  const logout = () => {
    localStorage.removeItem('token')
    user.value = null
  }

  // 计算属性
  const isLoggedIn = computed(() => !!user.value)
  const username = computed(() => user.value?.username || '')
  const userId = computed(() => user.value?.id)
  const avatarUrl = computed(() => user.value?.avatar_url || '/default-avatar.png')
  const isAdmin = computed(() => !!user.value?.is_admin)
  const adminRole = computed(() => user.value?.admin_role || null)

  return {
    user,
    loading,
    error,
    avatarLoading,
    isLoggedIn,
    username,
    userId,
    avatarUrl,
    isAdmin,
    adminRole,
    loadUser,
    uploadAvatar,
    logout
  }
}) 