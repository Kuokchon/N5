/**
 * 认证配置模块
 * 包含JWT密钥等敏感配置信息
 */

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

module.exports = {
  JWT_SECRET
};