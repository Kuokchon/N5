/**
 * 管理員狀態存儲
 * 
 * 使用Pinia管理管理員登錄狀態和相關數據
 */

import { defineStore } from 'pinia';
import axios from 'axios';
import { ref, computed } from 'vue';
import { API_BASE_URL } from '../config';

// 獲取API基礎URL
const getBaseUrl = () => {
  return localStorage.getItem('api_base_url') || 'http://localhost:3000';
};

// 創建Admin Store
export const useAdminStore = defineStore('admin', () => {
  // 狀態
  const admin = ref(null);
  const token = ref(localStorage.getItem('admin_token') || '');
  const isLoading = ref(false);
  const error = ref(null);

  // 計算屬性
  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => !!admin.value);
  const username = computed(() => admin.value?.username || 'Admin');
  const adminRole = computed(() => admin.value?.role || null);

  // 權限檢查函數
  const hasPermission = (permission) => {
    // 檢查是否已登錄
    if (!admin.value || !admin.value.role) {
      return false;
    }
    
    // 超級管理員擁有所有權限
    if (admin.value.role === 'super_admin') {
      return true;
    }
    
    // 運營管理員權限
    if (admin.value.role === 'operation') {
      const operationPermissions = [
        'manage_users', 
        'view_transactions', 
        'view_logs'
      ];
      return operationPermissions.includes(permission);
    }
    
    // 開發者權限
    if (admin.value.role === 'developer') {
      const developerPermissions = [
        'manage_ai_apps', 
        'manage_settings',
        'view_logs'
      ];
      return developerPermissions.includes(permission);
    }
    
    return false;
  };

  // 方法
  // 管理員登錄
  async function login(credentials) {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 檢查憑據是否合法
      if (!credentials.username || !credentials.password) {
        throw new Error('用戶名和密碼不能為空');
      }
      
      const response = await axios.post(`${getBaseUrl()}/api/admin/login`, {
        username: credentials.username,
        password: credentials.password
      });
      
      // 處理響應
      if (response.data && response.data.token) {
        // 保存令牌到本地存儲和狀態
        token.value = response.data.token;
        localStorage.setItem('admin_token', response.data.token);
        localStorage.setItem('token', response.data.token); // 同時保存到普通用戶令牌，實現共用登錄
        
        // 保存管理員信息
        admin.value = response.data.admin;
        
        // 清除錯誤
        error.value = null;
        
        return response.data;
      } else {
        throw new Error('登錄響應缺少令牌');
      }
    } catch (err) {
      // 處理錯誤
      console.error('管理員登錄錯誤:', err);
      error.value = err.response?.data?.error || err.message || '登錄失敗';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  // 管理員登出
  async function logout() {
    try {
      // 清除本地存儲中的令牌
      localStorage.removeItem('admin_token');
      
      // 清除狀態
      token.value = '';
      admin.value = null;
      
      // 調用登出API
      await axios.post(`${getBaseUrl()}/api/admin/logout`, {}, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      }).catch(err => {
        console.warn('管理員登出API調用失敗，但已清除本地令牌:', err);
      });
      
      return true;
    } catch (err) {
      console.error('管理員登出錯誤:', err);
      return false;
    }
  }

  // 獲取管理員信息
  async function getAdminInfo() {
    if (!token.value) {
      return null;
    }
    
    isLoading.value = true;
    
    try {
      const response = await axios.get(`${getBaseUrl()}/api/admin/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      });
      
      admin.value = response.data;
      return response.data;
    } catch (err) {
      console.error('獲取管理員信息錯誤:', err);
      
      // 如果是未授權錯誤，清除令牌
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        token.value = '';
        admin.value = null;
        localStorage.removeItem('admin_token');
      }
      
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // 狀態
    admin,
    token,
    isLoading,
    error,
    
    // 計算屬性
    isLoggedIn,
    isAdmin,
    username,
    adminRole,
    hasPermission,
    
    // 方法
    login,
    logout,
    getAdminInfo
  };
});