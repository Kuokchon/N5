/**
 * 配置文件
 * 
 * 包含應用程序的全局配置設置
 * 從環境變量中讀取配置，如果不存在則使用默認值
 */

module.exports = {
  // JWT配置
  jwtSecret: process.env.JWT_SECRET || 'your_super_secure_jwt_secret_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // 服務器配置
  port: process.env.PORT || 3000,
  
  // 頭像配置
  avatarMaxSize: 5 * 1024 * 1024, // 5MB
  avatarAllowedFormats: ['image/jpeg', 'image/png', 'image/gif'],
  
  // 路徑配置
  publicDir: 'public',
  avatarDir: 'public/avatars',
  
  // 日誌配置
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // 開發環境標誌
  isDevelopment: process.env.NODE_ENV !== 'production'
};