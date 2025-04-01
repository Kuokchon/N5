/**
 * 格式化金额显示，如：100 -> ¥100.00
 * @param {number} amount 金额
 * @returns {string} 格式化后的金额字符串
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '¥0.00';
  return `¥${parseFloat(amount).toFixed(2)}`;
};

/**
 * 格式化日期时间，如：2023-01-01T12:00:00Z -> 2023-01-01 12:00:00
 * @param {string} dateString 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
};

/**
 * 格式化日期，如：2023-01-01T12:00:00Z -> 2023-01-01
 * @param {string} dateString 日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

/**
 * 计算到期剩余天数
 * @param {string} expiryDate 过期日期字符串
 * @returns {number} 剩余天数
 */
export const getRemainingDays = (expiryDate) => {
  if (!expiryDate) return 0;
  
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

/**
 * 交易类型文本映射
 * @param {string} type 交易类型
 * @returns {string} 交易类型中文文本
 */
export const getTransactionTypeText = (type) => {
  const typeMap = {
    'topup': '充值',
    'deduction': '消费'
  };
  return typeMap[type] || type;
};

/**
 * 交易状态文本映射
 * @param {string} status 交易状态
 * @returns {string} 交易状态中文文本
 */
export const getTransactionStatusText = (status) => {
  const statusMap = {
    'pending': '处理中',
    'completed': '已完成',
    'failed': '失败'
  };
  return statusMap[status] || status;
};

/**
 * 将用户信息存储到本地存储
 * @param {object} user 用户信息对象
 * @param {string} token 认证令牌
 */
export const saveUserToLocalStorage = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

/**
 * 从本地存储获取用户信息
 * @returns {object|null} 用户信息对象或null
 */
export const getUserFromLocalStorage = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * 清除本地存储中的用户信息和令牌
 */
export const clearUserFromLocalStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

/**
 * 生成随机ID
 * @returns {string} 随机ID
 */
export const generateRandomId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}; 