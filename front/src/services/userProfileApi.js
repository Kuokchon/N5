/**
 * 用户资料API服务
 * 
 * 提供用户资料相关的API调用，包括：
 * 1. 更新用户简介
 * 2. 修改密码
 * 3. 绑定手机号
 * 4. 绑定微信账号
 */

import axios from 'axios';
import { apiBaseUrl } from './api';

// 获取认证头信息
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 获取API基础URL
const getBaseUrl = () => {
  return apiBaseUrl || 'http://localhost:3000';
};

/**
 * 用户资料API服务
 */
export const userProfileApi = {
  /**
   * 更新用户简介
   * 
   * @param {string} bio - 用户简介
   * @returns {Promise<Object>} - 更新结果
   */
  updateBio: async (bio) => {
    try {
      const response = await axios.put(
        `${getBaseUrl()}/api/auth/profile/bio`,
        { bio },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('更新用户简介失败:', error);
      throw error;
    }
  },
  
  /**
   * 修改密码
   * 
   * @param {string} currentPassword - 当前密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} - 更新结果
   */
  updatePassword: async (currentPassword, newPassword) => {
    try {
      const response = await axios.put(
        `${getBaseUrl()}/api/auth/profile/password`,
        { currentPassword, newPassword },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('修改密码失败:', error);
      throw error;
    }
  },
  
  /**
   * 绑定手机号
   * 
   * @param {string} phone - 手机号
   * @returns {Promise<Object>} - 绑定结果
   */
  bindPhone: async (phone) => {
    try {
      const response = await axios.put(
        `${getBaseUrl()}/api/auth/profile/phone`,
        { phone },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('绑定手机号失败:', error);
      throw error;
    }
  },
  
  /**
   * 绑定微信账号
   * 
   * @param {string} wechat - 微信账号
   * @returns {Promise<Object>} - 绑定结果
   */
  bindWechat: async (wechat) => {
    try {
      const response = await axios.put(
        `${getBaseUrl()}/api/auth/profile/wechat`,
        { wechat },
        { headers: getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('绑定微信账号失败:', error);
      throw error;
    }
  }
};