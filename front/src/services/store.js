/**
 * store.js - 全局状态管理模块
 * 
 * 该模块使用Vue的响应式API实现简单的状态管理
 * 管理用户信息、会员卡信息等全局状态
 * 提供状态读取和修改的方法
 */
import { reactive, readonly } from 'vue';
import { authAPI, memberCardAPI, apiBaseUrl } from './api';
import { saveUserToLocalStorage, clearUserFromLocalStorage, getUserFromLocalStorage, isLoggedIn as checkIsLoggedIn } from './utils';
import axios from 'axios';

// 獲取API基礎URL函數
function getApiBaseUrl() {
  return localStorage.getItem('api_base_url') || apiBaseUrl;
}

// 创建响应式状态
const state = reactive({
  // 用户状态
  user: getUserFromLocalStorage() || null,
  // 会员卡状态
  memberCard: {
    balance: 0,
    status: 'active',
    expired_at: null,
    created_at: null,
    loading: false,
    error: null
  },
  // 全局加载状态
  loading: false,
  // 全局错误状态
  error: null,
  // 登录结果
  loginResult: null
});

// 定义操作状态的方法
const actions = {
  /**
   * 用户登录
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(email, password) {
    try {
      state.loading = true;
      state.error = null;
      state.loginResult = null;
      
      console.log('開始登入流程');
      
      // 嘗試使用API服務登入
      try {
        const { authAPI } = await import('./api');
        const response = await authAPI.login({ email, password });
        console.log('登入API響應:', response);
        
        // 處理不同的API響應格式
        if (response && (response.token || response.data?.token)) {
          const token = response.token || response.data?.token;
          const user = response.user || response.data?.user || null;
          
          // 設置token
          localStorage.setItem('token', token);
          
          // 緩存用戶數據
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            state.user = user;
          }
          
          // 觸發登錄狀態變化事件，通知其他組件
          window.dispatchEvent(new Event('login-state-change'));
          
          return {
            success: true,
            token,
            user
          };
        } else {
          throw new Error('API返回格式異常，未找到token或user');
        }
      } catch (apiError) {
        console.error('登录错误:', apiError);
        
        // 如果使用API服務失敗，嘗試直接使用axios
        const userData = { email, password };
        if (!userData.retry) {
          console.log('嘗試使用直接方式登入...');
          
          try {
            // 獲取API基礎URL
            const baseUrl = getApiBaseUrl();
            
            // 嘗試多個可能的登入端點
            const endpoints = [
              `${baseUrl}/auth/login`,
              `${baseUrl}/auth/login`,
              `${baseUrl}/auth/login`,
              `${baseUrl}/auth/login`
            ];
            
            // 依次嘗試每個端點
            for (const endpoint of endpoints) {
              try {
                console.log(`嘗試登入端點: ${endpoint}`);
                const response = await axios.post(endpoint, userData, {
                  headers: { 'Content-Type': 'application/json' },
                  timeout: 10000
                });
                
                if (response.data) {
                  console.log('直接登入成功:', response.data);
                  
                  // 成功保存可用的API端點
                  const baseEndpoint = endpoint.substring(0, Math.max(endpoint.indexOf('/auth'), endpoint.indexOf('/login')));
                  localStorage.setItem('working_api_url', baseEndpoint > 0 ? baseEndpoint : baseUrl);
                  
                  const pathPart = endpoint.substring(Math.max(endpoint.indexOf('/auth'), endpoint.indexOf('/login')));
                  localStorage.setItem('working_auth_endpoint', pathPart);
                  
                  const token = response.data.token || response.data.access_token;
                  const user = response.data.user || response.data.data;
                  
                  if (token) {
                    localStorage.setItem('token', token);
                    
                    if (user) {
                      localStorage.setItem('user', JSON.stringify(user));
                      state.user = user;
                    }
                    
                    // 觸發登錄狀態變化事件
                    window.dispatchEvent(new Event('login-state-change'));
                    
                    return {
                      success: true,
                      token,
                      user
                    };
                  }
                }
              } catch (err) {
                console.log(`端點 ${endpoint} 登入失敗:`, err.message);
                // 繼續嘗試下一個端點
              }
            }
            
            // 所有端點都失敗，拋出原始錯誤
            throw apiError;
          } catch (backupError) {
            console.error('備用登入方法也失敗:', backupError);
            throw apiError; // 使用原始錯誤
          }
        } else {
          throw apiError;
        }
      }
    } catch (err) {
      console.error('登录错误:', err);
      
      // 設置錯誤信息
      if (err.response) {
        console.log('錯誤響應狀態:', err.response.status);
        console.log('錯誤響應數據:', err.response.data);
        
        // 如果服務器返回明確的錯誤信息，則使用該信息
        if (err.response.data && err.response.data.message) {
          state.error = err.response.data.message;
        } else {
          state.error = `服務器錯誤 (${err.response.status})`;
        }
      } else if (err.message) {
        state.error = err.message;
      } else {
        state.error = '登入過程中發生未知錯誤';
      }
      
      return {
        success: false,
        error: state.error
      };
    } finally {
      state.loading = false;
    }
  },
  
  // 用户注册
  async register(username, email, password) {
    try {
      state.loading = true;
      state.error = null;
      
      await authAPI.register({ username, email, password });
      
      return { success: true };
    } catch (error) {
      console.log('注册错误:', error);
      state.error = error.response?.data?.message || '注册失败，请稍后再试';
      return { success: false, error: state.error };
    } finally {
      state.loading = false;
    }
  },
  
  /**
   * 用户退出登录
   */
  logout() {
    clearUserFromLocalStorage();
    state.user = null;
    // 觸發登錄狀態變化事件，通知其他組件
    window.dispatchEvent(new Event('login-state-change'));
  },
  
  // 获取当前用户信息
  async fetchCurrentUser() {
    try {
      state.loading = true;
      
      // 檢查token是否存在
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('獲取用戶信息失敗：未找到token');
        return { success: false, error: '用戶未登錄' };
      }
      
      console.log('開始獲取用戶信息...');
      const response = await authAPI.getCurrentUser();
      console.log('getCurrentUser響應:', response);
      
      // 嘗試從多種可能的響應結構中獲取用戶數據
      let userData = null;
      
      if (response) {
        if (response.user) {
          userData = response.user;
        } else if (response.success && response.data) {
          userData = response.data;
        } else if (response.id || response.username) {
          userData = response;
        }
      }
      
      if (userData) {
        // 確保用戶數據包含必要字段
        if (!userData.id && userData.userId) {
          userData.id = userData.userId;
        }
        if (!userData.id && userData._id) {
          userData.id = userData._id;
        }
        
        state.user = userData;
        console.log('用戶信息獲取成功:', userData);
        return { success: true };
      } else {
        console.error('獲取用戶信息響應格式不符合預期:', response);
        throw new Error('获取用户信息响应缺少用户数据');
      }
    } catch (error) {
      console.error('获取用户信息错误:', error);
      
      if (error.response) {
        console.log('錯誤響應碼:', error.response.status);
        console.log('錯誤數據:', error.response.data);
      }
      
      if (error.response?.status === 401) {
        // 如果令牌无效，清除本地存储
        actions.logout();
      }
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || '获取用户信息失败',
        status: error.response?.status
      };
    } finally {
      state.loading = false;
    }
  },
  
  // 获取会员卡详情
  async fetchMemberCardDetails() {
    try {
      state.memberCard.loading = true;
      state.memberCard.error = null;
      
      const response = await memberCardAPI.getCardDetails();
      
      if (response && response.member_card) {
        state.memberCard = {
          ...response.member_card,
          loading: false,
          error: null
        };
        
        return { success: true };
      } else {
        throw new Error('获取会员卡信息响应缺少数据');
      }
    } catch (error) {
      console.log('获取会员卡信息错误:', error);
      state.memberCard.error = error.response?.data?.message || '获取会员卡信息失败';
      return { success: false, error: state.memberCard.error };
    } finally {
      state.memberCard.loading = false;
    }
  },
  
  // 更新会员卡余额（在应用扣费或充值后调用）
  updateBalance(newBalance) {
    if (state.memberCard) {
      state.memberCard.balance = newBalance;
    }
  },
  
  // 检查用户是否已登录
  isLoggedIn() {
    return checkIsLoggedIn() && !!state.user;
  },
  
  // 获取当前用户信息
  getUser() {
    return state.user || {};
  }
};

// 暴露只读状态，防止直接修改状态
const getState = () => readonly(state);

export default {
  state: getState,
  ...actions
};