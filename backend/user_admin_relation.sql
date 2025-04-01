-- 添加管理員相關欄位到用戶表（忽略已存在的欄位錯誤）
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN admin_role VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN admin_created_at DATETIME NULL;

-- 創建索引提高查詢效率
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_admin_role ON users(admin_role);

-- 將現有管理員信息從admin_users表同步到users表

-- 步驟1: 找出已經存在於users表中的管理員
UPDATE users u
JOIN admin_users a ON u.username = a.username
SET 
    u.is_admin = TRUE,
    u.admin_role = a.role,
    u.admin_created_at = NOW();

-- 步驟2: 將不存在於users表中的管理員添加到users表
INSERT INTO users (username, password, email, is_admin, admin_role, admin_created_at, created_at)
SELECT 
    a.username, 
    a.password_hash, 
    a.email, 
    TRUE, 
    a.role, 
    a.last_login_time, 
    a.created_at
FROM admin_users a
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.username = a.username
);

-- 創建視圖方便查詢管理員信息
DROP VIEW IF EXISTS admin_users_view;
CREATE VIEW admin_users_view AS
SELECT 
    id,
    username,
    email,
    admin_role,
    admin_created_at,
    created_at
FROM 
    users
WHERE 
    is_admin = TRUE; 