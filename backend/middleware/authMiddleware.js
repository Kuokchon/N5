/**
 * 身份驗證中間件
 * 
 * 包含JWT身份驗證的相關中間件，用於保護需要登錄的API路由
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');
const UserModel = require('../models/user_model');
const AdminModel = require('../models/admin_model');

// 驗證普通用戶JWT令牌
const authenticateUser = async (req, res, next) => {
  try {
    // 從請求頭獲取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供認證令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 驗證令牌
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // 確保是用戶令牌
    if (decoded.type !== 'user') {
      return res.status(403).json({ error: '無效的用戶令牌' });
    }
    
    // 從數據庫獲取用戶信息
    const user = await UserModel.get_user_by_id(decoded.id);
    if (!user) {
      return res.status(404).json({ error: '用戶不存在' });
    }
    
    // 將用戶信息添加到請求對象
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_premium: user.is_premium === 1
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '認證令牌已過期，請重新登錄' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '無效的認證令牌' });
    }
    
    console.error('身份驗證過程中出錯:', error);
    return res.status(500).json({ error: '認證過程中出錯' });
  }
};

// 驗證管理員JWT令牌
const authenticateAdmin = async (req, res, next) => {
  try {
    // 從請求頭獲取令牌
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供認證令牌' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 驗證令牌
    const decoded = jwt.verify(token, config.jwtSecret);
    
    // 檢查用戶是否為管理員 - 支持兩種令牌類型
    // 1. type=admin 的管理員令牌
    // 2. type=user 的普通用戶令牌，但該用戶擁有管理員權限
    let adminData = null;
    
    if (decoded.type === 'admin') {
      // 管理員令牌路徑
      const isAdmin = await AdminModel.is_admin(decoded.id);
      if (!isAdmin) {
        return res.status(403).json({ error: '無權訪問管理員資源' });
      }
      
      // 從數據庫獲取管理員信息
      adminData = await AdminModel.get_admin_by_id(decoded.id);
    } else if (decoded.type === 'user') {
      // 普通用戶令牌路徑 - 檢查該用戶是否有管理員權限
      const isAdmin = await AdminModel.is_admin(decoded.id);
      if (!isAdmin) {
        return res.status(403).json({ error: '用戶無管理員權限' });
      }
      
      // 從數據庫獲取管理員信息
      adminData = await AdminModel.get_admin_by_id(decoded.id);
    } else {
      return res.status(403).json({ error: '無效的令牌類型' });
    }
    
    if (!adminData) {
      return res.status(404).json({ error: '管理員信息不存在' });
    }
    
    // 將管理員信息添加到請求對象
    req.admin = {
      id: adminData.id,
      username: adminData.username,
      email: adminData.email,
      role: adminData.role
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: '認證令牌已過期，請重新登錄' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: '無效的認證令牌' });
    }
    
    console.error('管理員身份驗證過程中出錯:', error);
    return res.status(500).json({ error: '認證過程中出錯' });
  }
};

// 驗證管理員權限
const checkAdminPermission = (requiredPermission) => {
  return (req, res, next) => {
    // 驗證是否有管理員信息
    if (!req.admin) {
      return res.status(401).json({ error: '未經授權，請先登錄' });
    }
    
    // 驗證權限
    if (!AdminModel.has_permission(req.admin.role, requiredPermission)) {
      return res.status(403).json({ error: '沒有訪問此資源的權限' });
    }
    
    next();
  };
};

// 驗證高級用戶權限
const checkPremiumUser = (req, res, next) => {
  if (!req.user || !req.user.is_premium) {
    return res.status(403).json({ error: '此功能僅適用於高級會員' });
  }
  
  next();
};

module.exports = {
  authenticateUser,
  authenticateAdmin,
  checkAdminPermission,
  checkPremiumUser
}; 