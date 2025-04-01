-- 用戶與管理員關聯SQL腳本
-- 1. 在USERS表中添加管理員角色字段

-- 首先添加is_admin字段，表示用戶是否有管理權限
ALTER TABLE users 
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN admin_role ENUM('super_admin', 'operation', 'developer') NULL,
ADD COLUMN admin_created_at DATETIME NULL;

-- 創建索引提高查詢效率
CREATE INDEX idx_users_is_admin ON users(is_admin);
CREATE INDEX idx_users_admin_role ON users(admin_role);

-- 2. 更新現有的管理員用戶數據
-- 將已存在admin_users中的用戶關聯到users表

-- 首先為每個管理員創建一個普通用戶賬號（如果不存在）
INSERT INTO users (username, email, password, is_admin, admin_role, created_at, admin_created_at)
SELECT 
    au.username, 
    au.email, 
    au.password_hash,
    TRUE,
    au.role,
    IFNULL(au.created_at, NOW()),
    au.created_at
FROM admin_users au
LEFT JOIN users u ON au.username = u.username
WHERE u.id IS NULL
ON DUPLICATE KEY UPDATE
    is_admin = TRUE,
    admin_role = au.role,
    admin_created_at = au.created_at;

-- 3. 更新已經同時存在於兩個表中的用戶
UPDATE users u
JOIN admin_users au ON u.username = au.username OR u.email = au.email
SET 
    u.is_admin = TRUE,
    u.admin_role = au.role,
    u.admin_created_at = au.created_at;

-- 4. 創建視圖，方便查詢管理員用戶
CREATE OR REPLACE VIEW v_admin_users AS
SELECT 
    id,
    username,
    email,
    is_admin,
    admin_role AS role,
    admin_created_at AS admin_since,
    created_at
FROM users
WHERE is_admin = TRUE;

-- 5. 添加觸發器，確保管理員表與用戶表同步（可選）
DELIMITER //
CREATE TRIGGER after_user_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF NEW.is_admin = TRUE AND (OLD.is_admin = FALSE OR OLD.is_admin IS NULL) THEN
        -- 當用戶被提升為管理員時，更新admin_created_at
        UPDATE users SET admin_created_at = NOW() WHERE id = NEW.id AND admin_created_at IS NULL;
    END IF;
END //
DELIMITER ; 