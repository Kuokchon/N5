-- 用户表添加头像相关字段
ALTER TABLE users 
ADD COLUMN avatar_url VARCHAR(255) DEFAULT '/default-avatar.png', -- 存储头像路径或URL
ADD COLUMN avatar_updated_at DATETIME; -- 记录最后上传时间

-- 创建头像历史记录表
CREATE TABLE IF NOT EXISTS user_avatars_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  avatar_url VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 创建索引以提高查询效率
CREATE INDEX idx_user_avatars_history_user_id ON user_avatars_history(user_id); 