/**
 * 管理員驗證功能測試
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// 創建數據庫連接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'qwer8877',
  database: 'member_card_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 測試管理員驗證
async function verifyAdminCredentials(login_id, password) {
  try {
    console.log(`測試驗證管理員憑據: login_id=${login_id}`);
    
    // 查詢管理員用戶
    const query = `
      SELECT id, username, email, password, admin_role
      FROM users 
      WHERE is_admin = TRUE AND (username = ? OR email = ?)
    `;
    
    const [rows] = await pool.query(query, [login_id, login_id]);
    
    if (!rows.length) {
      console.log('驗證失敗: 未找到管理員用戶');
      return null;
    }
    
    const admin = rows[0];
    console.log('找到管理員用戶:', {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.admin_role,
      password_hash: admin.password ? admin.password.substr(0, 10) + '...' : '無'
    });
    
    // 驗證密碼
    if (!admin.password) {
      console.log('驗證失敗: 密碼哈希為空');
      return null;
    }
    
    try {
      const isMatch = await bcrypt.compare(password, admin.password);
      console.log(`密碼驗證結果: ${isMatch ? '成功' : '失敗'}`);
      
      if (isMatch) {
        return {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.admin_role
        };
      } else {
        console.log('密碼不匹配');
        return null;
      }
    } catch (bcryptError) {
      console.error('密碼驗證失敗:', bcryptError);
      return null;
    }
  } catch (error) {
    console.error('驗證過程中出錯:', error);
    throw error;
  }
}

// 列出所有管理員用戶
async function listAdminUsers() {
  try {
    const [rows] = await pool.query(
      'SELECT id, username, email, admin_role, DATE_FORMAT(admin_created_at, "%Y-%m-%d %H:%i:%s") as last_login FROM users WHERE is_admin = TRUE'
    );
    
    console.log(`找到 ${rows.length} 個管理員用戶:`);
    console.table(rows);
    
    return rows;
  } catch (error) {
    console.error('查詢管理員用戶失敗:', error);
    throw error;
  }
}

// 重置特定用戶的密碼
async function resetPassword(username, newPassword) {
  try {
    // 密碼加密
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // 更新密碼
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [passwordHash, username]
    );
    
    if (result.affectedRows > 0) {
      console.log(`成功重置 "${username}" 的密碼`);
      return true;
    } else {
      console.log(`未找到用戶 "${username}"`);
      return false;
    }
  } catch (error) {
    console.error('重置密碼失敗:', error);
    throw error;
  }
}

// 執行測試
async function runTest() {
  try {
    console.log('=== 管理員驗證功能測試 ===\n');
    
    // 列出所有管理員用戶
    console.log('管理員用戶列表:');
    await listAdminUsers();
    
    // 重置admin密碼
    console.log('\n重置admin密碼:');
    await resetPassword('admin', 'admin123');
    
    // 嘗試驗證admin登錄
    console.log('\n測試admin登錄:');
    const adminUser = await verifyAdminCredentials('admin', 'admin123');
    if (adminUser) {
      console.log('admin登錄成功:', adminUser);
    } else {
      // 測試其他管理員
      console.log('\n測試其他管理員登錄:');
      const result = await verifyAdminCredentials('developer', 'admin123');
      console.log('登錄結果:', result);
    }
    
    console.log('\n=== 測試完成 ===');
  } catch (error) {
    console.error('測試過程中出錯:', error);
  } finally {
    // 關閉連接池
    await pool.end();
  }
}

// 執行測試
runTest(); 