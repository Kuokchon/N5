-- 管理员和操作日志表结构 SQL 脚本

-- 管理员用户表
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  role ENUM('super_admin', 'operation', 'developer') NOT NULL DEFAULT 'operation',
  last_login_time DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  target_id INT,
  target_type VARCHAR(50),
  before_value TEXT,
  after_value TEXT,
  description VARCHAR(255),
  ip_address VARCHAR(45),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_id (admin_id),
  INDEX idx_operation_type (operation_type),
  INDEX idx_target_type_id (target_type, target_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 初始化超级管理员账号 (密码为 'admin123')
-- 注意：这是一个示例密码哈希，实际部署时应该使用 bcrypt 自动生成
INSERT INTO admin_users (username, password_hash, email, role, created_at)
VALUES 
  ('admin', '$2b$10$JuCR0dVaZ0qW5Wl5Q5lZvOdJi.sSPEFe6ynzlWk/MJoFk5vOUNyM.', 'admin@example.com', 'super_admin', NOW())
ON DUPLICATE KEY UPDATE
  email = VALUES(email);

-- 运营管理员示例账号 (密码为 'operation123')
INSERT INTO admin_users (username, password_hash, email, role, created_at)
VALUES 
  ('operation', '$2b$10$l9nzS0JM/x/7pTLklUr6BOJKbGKqYJBQqrF5X.uUNBt1ydyKspBZ2', 'operation@example.com', 'operation', NOW())
ON DUPLICATE KEY UPDATE
  email = VALUES(email);

-- 开发者示例账号 (密码为 'developer123')
INSERT INTO admin_users (username, password_hash, email, role, created_at)
VALUES 
  ('developer', '$2b$10$1zjZDM6HtPLOiK.f0x8nheHyqb3fSHqxiUkuH/ow/NGZYXhGTyOmK', 'developer@example.com', 'developer', NOW())
ON DUPLICATE KEY UPDATE
  email = VALUES(email); 