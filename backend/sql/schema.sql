-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 会员卡表
CREATE TABLE IF NOT EXISTS member_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('active', 'frozen') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expired_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 交易记录表
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('topup', 'deduction') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  related_app_id INT,
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  third_party_txid VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- AI应用定价表
CREATE TABLE IF NOT EXISTS ai_app_pricing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  app_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 我们不能直接使用IF NOT EXISTS创建索引
-- 通过ALTER TABLE添加索引（初始化数据库时会处理异常）
ALTER TABLE transactions ADD INDEX idx_transactions_user_id (user_id);
ALTER TABLE transactions ADD INDEX idx_transactions_status (status);
ALTER TABLE transactions ADD INDEX idx_transactions_third_party_txid (third_party_txid); 