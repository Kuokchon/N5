/**
 * 認證中間件
 * 
 * 提供路由導航守衛，用於身份驗證和授權檢查
 */

import { useUserStore } from '../stores/user';
import { useAdminStore } from '../stores/admin';
import store from '../services/store';

/**
 * 要求用戶已登錄
 * 如果未登錄，會重定向到登錄頁面
 */
export const requireAuth = async (to, from, next) => {
  const token = localStorage.getItem('token');
  const userStore = useUserStore();
  
  if (!token) {
    // 未找到令牌，重定向到登錄頁面
    return next({ 
      path: '/login', 
      query: { redirect: to.fullPath }
    });
  }
  
  try {
    // 嘗試加載用戶信息
    if (!userStore.user) {
      await userStore.loadUser();
    }
    
    if (!userStore.user) {
      // 用戶信息加載失敗，可能是令牌無效
      localStorage.removeItem('token');
      return next({ 
        path: '/login', 
        query: { redirect: to.fullPath } 
      });
    }
    
    // 用戶已登錄，允許訪問
    next();
  } catch (error) {
    console.error('身份驗證錯誤:', error);
    // 出現錯誤，重定向到登錄頁面
    localStorage.removeItem('token');
    next({ 
      path: '/login', 
      query: { redirect: to.fullPath }
    });
  }
};

/**
 * 要求用戶具有管理員權限
 * 如果未登錄或不是管理員，會重定向到管理員登錄頁面
 */
export const requireAdmin = async (to, from, next) => {
  const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
  const userStore = useUserStore();
  const adminStore = useAdminStore();
  
  if (!token) {
    // 未找到令牌，重定向到管理員登錄頁面
    return next({ 
      path: '/admin/login', 
      query: { redirect: to.fullPath }
    });
  }
  
  try {
    // 檢查是否已有管理員信息
    if (adminStore.isLoggedIn && adminStore.admin) {
      // 已有管理員信息，允許訪問
      return next();
    }
    
    // 嘗試獲取管理員信息
    try {
      await adminStore.getAdminInfo();
      if (adminStore.admin) {
        // 成功獲取管理員信息，允許訪問
        return next();
      }
    } catch (adminErr) {
      console.warn('獲取管理員信息失敗:', adminErr);
      // 嘗試通過用戶信息檢查是否有管理員權限
    }
    
    // 檢查普通用戶信息
    if (!userStore.user) {
      await userStore.loadUser();
    }
    
    if (userStore.user && userStore.isAdmin) {
      // 用戶有管理員權限，允許訪問
      // 同步管理員令牌
      localStorage.setItem('admin_token', token);
      return next();
    }
    
    // 用戶不是管理員，重定向到管理員登錄頁面
    console.log('用戶沒有管理員權限，重定向到管理員登錄頁面');
    return next({ 
      path: '/admin/login', 
      query: { redirect: to.fullPath }
    });
  } catch (error) {
    console.error('管理員身份驗證錯誤:', error);
    // 出現錯誤，重定向到管理員登錄頁面
    localStorage.removeItem('admin_token');
    next({ 
      path: '/admin/login', 
      query: { redirect: to.fullPath }
    });
  }
};

/**
 * 如果用戶已登錄，則重定向到用戶中心
 * 用於登錄和註冊頁面，防止已登錄用戶再次訪問
 */
export const redirectIfAuthenticated = (to, from, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // 已登錄，重定向到用戶中心
    return next('/balance');
  }
  
  // 未登錄，允許訪問登錄頁面
  next();
}; 