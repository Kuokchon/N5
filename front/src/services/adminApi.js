/**
 * 管理員API服務
 * 
 * 處理與管理員後台相關的API請求
 */

import axios from 'axios';

// 獲取API基礎URL
const getBaseUrl = () => {
  return localStorage.getItem('api_base_url') || 'http://localhost:3000';
};

// 獲取授權頭信息
const getAuthHeader = () => {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('token') || '';
  return {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  };
};

/**
 * 管理員API服務
 */
const adminApi = {
  // 管理員登錄
  login: async (credentials) => {
    try {
      const response = await axios.post(`${getBaseUrl()}/api/admin/login`, credentials);
      return response.data;
    } catch (error) {
      console.error('管理員登錄錯誤:', error);
      throw error;
    }
  },

  // 管理員登出
  logout: async () => {
    try {
      const response = await axios.post(`${getBaseUrl()}/api/admin/logout`, {}, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('管理員登出錯誤:', error);
      throw error;
    }
  },

  // 獲取當前管理員信息
  getAdminInfo: async () => {
    try {
      const response = await axios.get(`${getBaseUrl()}/api/admin/me`, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('獲取管理員信息錯誤:', error);
      throw error;
    }
  },

  // 獲取管理員列表
  getAdminList: async (page = 1, limit = 10, filters = {}) => {
    try {
      const params = { page, limit, ...filters };
      const response = await axios.get(`${getBaseUrl()}/api/admin/admins`, { 
        ...getAuthHeader(),
        params
      });
      return response.data;
    } catch (error) {
      console.error('獲取管理員列表錯誤:', error);
      throw error;
    }
  },

  // 創建新管理員
  createAdmin: async (adminData) => {
    try {
      const response = await axios.post(`${getBaseUrl()}/api/admin/admins`, adminData, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('創建管理員錯誤:', error);
      throw error;
    }
  },

  // 更新管理員信息
  updateAdmin: async (adminId, adminData) => {
    try {
      const response = await axios.put(`${getBaseUrl()}/api/admin/admins/${adminId}`, adminData, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('更新管理員錯誤:', error);
      throw error;
    }
  },

  // 刪除管理員
  deleteAdmin: async (adminId) => {
    try {
      const response = await axios.delete(`${getBaseUrl()}/api/admin/admins/${adminId}`, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('刪除管理員錯誤:', error);
      throw error;
    }
  },

  // 提升用戶為管理員
  promoteToAdmin: async (userId, role) => {
    try {
      const response = await axios.post(`${getBaseUrl()}/api/admin/admins/promote/${userId}`, { role }, getAuthHeader());
      return response.data;
    } catch (error) {
      console.error('提升用戶為管理員錯誤:', error);
      throw error;
    }
  }
};

export default adminApi; 