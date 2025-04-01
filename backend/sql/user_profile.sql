-- 用户表添加个人资料相关字段
ALTER TABLE users 
ADD COLUMN bio TEXT DEFAULT NULL, -- 用户个人简介
ADD COLUMN phone VARCHAR(20) DEFAULT NULL, -- 用户手机号
ADD COLUMN wechat VARCHAR(50) DEFAULT NULL; -- 用户微信账号

-- 添加更新时间字段，如果不存在的话
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_wechat ON users(wechat);