/**
 * api.js - API服務模塊
 * 
 * 該模塊封裝了與後端API的所有交互邏輯，提供統一的接口調用方式
 * 包含請求攔截器用於添加認證信息，響應攔截器用於處理常見錯誤
 * 按功能模塊劃分不同的API服務（用戶、會員卡、交易、AI應用等）
 */
import axios from 'axios';
import store from '../store';

// 檢測當前環境，決定API地址
function get_api_base_url() {
  // 固定使用http://localhost:3000作為基礎URL
  return 'http://localhost:3000';
}

// 創建axios實例
const api = axios.create({
  baseURL: get_api_base_url(),
  timeout: 15000, // 增加超時時間，避免網絡波動
  headers: {
    'Content-Type': 'application/json'
  }
});

// 導出API基礎URL供其他模塊使用
export const apiBaseUrl = get_api_base_url();

// 設置API基礎URL（可通過開發工具手動修改）
export function set_api_base_url(url) {
  // 此功能保留但不再使用，始終返回固定URL
  console.log('API地址已固定為http://localhost:3000，忽略設置:', url);
  return 'http://localhost:3000';
}

/**
 * 請求攔截器
 * 在每個請求發送前自動從localStorage獲取token並添加到請求頭
 */
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    console.log('請求錯誤:', error);
    return Promise.reject(error);
  }
);

/**
 * 響應攔截器
 * 處理API響應，提取數據或處理常見錯誤（如401未授權）
 */
api.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    console.log('響應錯誤:', error);
    
    // 避免在未定義的情况下訪問屬性
    if (error.response) {
      // 處理401錯誤（未授權），如令牌過期，但不進行頁面跳轉
      if (error.response.status === 401) {
        // 僅清除token和用戶信息，不進行頁面跳轉
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // 移除自動跳轉到登錄頁的行為
        // window.location.href = '/login';
      }
      
      // 在控制台輸出詳細錯誤信息
      console.log('錯誤詳情:', {
        status: error.response.status,
        message: error.response.data?.message || '未知錯誤',
        data: error.response.data
      });
    } else if (error.request) {
      // 請求已發送但未收到響應（可能是網絡問題）
      console.log('未收到響應:', error.request);
    } else {
      // 請求設置出錯
      console.log('請求設置錯誤:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * 用戶相關API服務
 * 包含登錄、註冊、獲取用戶信息等功能
 */
export const userApi = {
  // 用戶登錄
  login: async (loginData) => {
    try {
      console.log('嘗試登入...');
      
      // 使用固定的登入端點
      console.log('使用端點: /api/auth/login');
      const response = await api.post('/api/auth/login', loginData);
      
      // 返回響應結果
      return response;
    } catch (error) {
      console.error('登入失敗:', error);
      throw error;
    }
  },
  // 獲取用戶信息
  getUser: () => {
    return api.get('/api/auth/me');
  },
  // 用戶登出
  logout: () => {
    return api.post('/api/auth/logout');
  },
  // 上傳用戶頭像 - 使用JWT解析获取用户ID并支持调试模式
  uploadAvatar: async (_, file) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      // 添加调试标记，临时绕过权限验证（仅开发环境）
      formData.append('debug', 'true');
      
      // 获取JWT token
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到授权令牌，请先登录');
      }
      
      console.log('上传头像 - Token存在:', token.substring(0, 10) + '...');
      
      // 从localStorage获取用户对象
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        throw new Error('未找到用户信息，请重新登录');
      }
      
      let user;
      try {
        user = JSON.parse(userJson);
        console.log('解析的用户数据:', {
          id: user.id,
          username: user.username,
          hasAvatarUrl: !!user.avatar_url
        });
      } catch (e) {
        console.error('解析用户数据失败:', e);
        throw new Error('解析用户数据失败');
      }
      
      if (!user || !user.id) {
        console.error('用户数据不完整:', user);
        throw new Error('用户数据不完整，缺少ID');
      }
      
      // 使用用户对象中的ID，确保与JWT匹配
      const currentUserId = user.id;
      console.log('上传头像 - 使用用户ID:', currentUserId);
      
      // 验证用户ID是有效的数字
      if (isNaN(parseInt(currentUserId))) {
        console.error('用户ID不是有效数字:', currentUserId);
        throw new Error('用户ID不是有效数字');
      }
      
      // 使用API实例确保添加token头
      console.log(`准备发送请求到: /api/users/${currentUserId}/avatar`);
      
      // 确保使用用户自己的ID，而不是URL中的ID (避免硬编码的17)
      const apiUrl = `/api/users/${currentUserId}/avatar`;
      console.log('最终请求URL:', apiUrl);
      
      const response = await api.put(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`  // 显式设置头部，确保token正确传递
        },
      });
      
      console.log('上传头像成功，响应:', response);
      return response;
    } catch (error) {
      console.error('上传头像失败:', error);
      if (error.response) {
        console.log('错误状态码:', error.response.status);
        console.log('错误数据:', error.response.data);
        
        // 特殊处理权限错误
        if (error.response.status === 403) {
          console.log('权限错误，尝试重新登录并获取最新用户ID');
          localStorage.removeItem('use_local_avatar'); // 清除本地头像标识
          
          // 清除token和用户信息，强制重新登录
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          throw new Error('无权上传头像，请重新登录后再试');
        }
      }
      throw error;
    }
  },
  
  // 上傳特定用戶的頭像
  uploadUserAvatar: async (formData) => {
    try {
      // 调试信息：打印当前token和用户ID
      const token = localStorage.getItem('token');
      console.log('上传用户头像 - Token:', token ? `${token.substring(0, 10)}...` : '未找到');
      
      // 确保从formData中正确提取用户ID
      // 直接使用store中的用户ID更可靠
      const userId = store.state.user.id;
      console.log('上传用户头像 - 用户ID:', userId);
      console.log('上传用户头像 - Store用户信息:', store.state.user);
      
      // 使用API实例确保添加token头
      const response = await api.put(`/api/users/${userId}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('上传用户头像失败:', error);
      throw error;
    }
  },
  
  // 獲取用戶頭像URL
  getUserAvatarUrl: (userId) => {
    try {
      if (!userId) {
        console.warn('获取头像URL时未提供用户ID');
        return getDefaultAvatarBase64();
      }
      
      // 如果启用了本地头像模式，直接返回默认头像
      if (localStorage.getItem('use_local_avatar') === 'true') {
        console.log('使用本地默认头像');
        return getDefaultAvatarBase64();
      }
      
      // 檢查用戶是否已經登入
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('获取头像URL时未检测到登录状态');
        return getDefaultAvatarBase64();
      }
      
      // 確保返回完整URL，包含時間戳避免緩存
      const randomParam = Date.now(); // 使用时间戳避免缓存
      return `http://localhost:3000/api/users/${userId}/avatar/image?t=${randomParam}`;
    } catch (error) {
      console.error('生成頭像URL出錯:', error);
      return getDefaultAvatarBase64();
    }
  }
};

// 認證相關API
export const authAPI = {
  // 用戶註冊
  register: async (registerData) => {
    try {
      console.log('嘗試註冊...');
      // 使用固定的註冊端點
      return await api.post('/api/auth/register', registerData);
    } catch (error) {
      console.error('註冊失敗:', error);
      throw error;
    }
  },
  
  // 用戶登入
  login: async (loginData) => {
    try {
      console.log('嘗試登入...');
      // 使用固定的登入端點
      return await api.post('/api/auth/login', loginData);
    } catch (error) {
      console.error('登入失敗:', error);
      throw error;
    }
  },
  
  // 獲取當前用戶信息
  getCurrentUser: async () => {
    try {
      console.log('嘗試獲取當前用戶信息');
      // 使用固定的用戶信息端點
      const response = await api.get('/api/auth/me');
      return handleUserResponse(response);
    } catch (error) {
      console.error('獲取用戶信息失敗:', error);
      if (error.response) {
        console.log('錯誤響應碼:', error.response.status);
        console.log('錯誤詳情:', error.response.data);
      }
      throw error;
    }
  },
  
  // 檢查API連接和token狀態
  checkApiHealth: async () => {
    try {
      console.log('進行API健康檢查...');
      // 使用根端點進行健康檢查，而不是/health
      const response = await fetch('http://localhost:3000', {
        method: 'HEAD',
        headers: { 'Accept': '*/*' },
        cache: 'no-cache'
      });
      
      return { 
        success: response.ok, 
        status: response.status,
        message: response.ok ? 'API服務器可達' : '伺服器返回非成功狀態碼'
      };
    } catch (error) {
      console.error('API健康檢查失敗:', error);
      return { 
        success: false, 
        message: '健康檢查過程出錯',
        error: error.message
      };
    }
  }
};

// 會員卡相關API
export const memberCardAPI = {
  // 獲取會員卡詳情
  getCardDetails: () => {
    return api.get('/api/member-card');
  },
  
  // 創建充值訂單
  createTopupOrder: (amount) => {
    return api.post('/api/member-card/topup', { amount });
  },
  
  // 使用AI應用並扣費
  useApp: (appId) => {
    return api.post('/api/member-card/use-app', { app_id: appId });
  },
  
  // 檢查是否可以使用AI應用
  checkAppUsage: (appId) => {
    return api.get(`/api/member-card/check-app/${appId}`);
  }
};

// 交易記錄相關API
export const transactionAPI = {
  // 獲取交易記錄列表
  getTransactions: (page = 1, limit = 10) => {
    return api.get(`/api/transactions?page=${page}&limit=${limit}`);
  },
  
  // 獲取交易詳情
  getTransactionDetails: (id) => {
    return api.get(`/api/transactions/${id}`);
  },
  
  // 檢查訂單狀態
  checkOrderStatus: (thirdPartyTxid) => {
    return api.get(`/api/transactions/order/${thirdPartyTxid}`);
  }
};

// AI應用相關API
export const aiAppAPI = {
  // 獲取所有應用列表
  getAllApps: () => {
    return api.get('/api/ai-apps');
  },
  
  // 獲取應用詳情
  getAppDetails: (appId) => {
    return api.get(`/api/ai-apps/${appId}`);
  },
  
  // 檢查應用使用權限
  checkAppPermission: (appId) => {
    return api.get(`/api/ai-apps/${appId}/check`);
  }
};

/**
 * 獲取用戶每日免費額度信息
 * 獲取當前用戶的每日免費額度使用情況
 */
async function get_daily_free_quota() {
  try {
    const response = await axios.get('/member-card/free-quota', {
      headers: get_auth_header()
    });
    return response.data;
  } catch (error) {
    handle_api_error(error);
    throw error;
  }
}

/**
 * 更新用戶每日免費額度
 * 僅供用戶更新自己的額度上限（需要VIP權限）
 */
async function update_my_free_quota(daily_free_limit) {
  try {
    const response = await axios.put('/member-card/my-free-quota', 
      { daily_free_limit },
      { headers: get_auth_header() }
    );
    return response.data;
  } catch (error) {
    handle_api_error(error);
    throw error;
  }
}

/**
 * 管理員更新用戶每日免費額度
 * 需要管理員權限
 */
async function admin_update_user_free_quota(user_id, daily_free_limit) {
  try {
    const response = await axios.put(`/member-card/free-quota/${user_id}`, 
      { daily_free_limit },
      { headers: get_auth_header() }
    );
    return response.data;
  } catch (error) {
    handle_api_error(error);
    throw error;
  }
}

/**
 * 處理用戶數據響應的輔助函數
 * 從不同格式的響應中提取用戶數據
 */
function handleUserResponse(response) {
  // 以標準格式返回用戶數據
  if (response && response.user) {
    return { user: response.user };
  } else if (response && response.data) {
    return { user: response.data };
  } else if (response && response.result) {
    return { user: response.result };
  } else if (response && (response.id || response.username || response._id)) {
    return { user: response };
  }
  
  throw new Error('無效的用戶數據結構');
}

// 返回一个Base64编码的简单默认头像
function getDefaultAvatarBase64() {
  // 这是一个简单的蓝色圆形默认头像，64x64像素
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0Ij48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzRBOTBFMiIvPjxwYXRoIGZpbGw9IiNGRkYiIGQ9Ik0zMiAxNmExMCAxMCAwIDEgMCAwIDIwIDEwIDEwIDAgMCAwIDAtMjB6bTAgMzBjLTguOTQgMC0xNiA0LjQ4LTE2IDEwaDMxYzAtNS41Mi03LjA2LTEwLTE2LTEweiIvPjwvc3ZnPg==';
}

export default {
  auth: authAPI,
  memberCard: memberCardAPI,
  transaction: transactionAPI,
  aiApp: aiAppAPI,
  get_daily_free_quota,
  update_my_free_quota,
  admin_update_user_free_quota
};