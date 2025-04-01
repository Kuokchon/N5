/**
 * 重置管理員密碼
 * 
 * 此腳本用於重置管理員密碼，解決密碼哈希不匹配問題
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// 設置默認密碼
const DEFAULT_PASSWORD = 'admin123';

async function resetAdminPassword() {
  console.log('開始重置管理員密碼...');
  
  // 創建數據庫連接
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qwer8877',
    database: 'member_card_system'
  });
  
  try {
    // 生成密碼哈希
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, saltRounds);
    
    // 查詢所有管理員
    const [admins] = await connection.query(
      'SELECT id, username, email, admin_role FROM users WHERE is_admin = TRUE'
    );
    
    if (admins.length === 0) {
      console.log('沒有找到管理員用戶');
      return;
    }
    
    console.log(`找到 ${admins.length} 個管理員用戶：`);
    admins.forEach(admin => {
      console.log(`  - ${admin.username} (${admin.email}), 角色: ${admin.admin_role}`);
    });
    
    // 重置所有管理員密碼
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE is_admin = TRUE',
      [passwordHash]
    );
    
    console.log(`✅ 已重置 ${result.affectedRows} 個管理員的密碼為： ${DEFAULT_PASSWORD}`);
    
    // 如果沒有管理員，創建一個默認管理員
    if (admins.length === 0) {
      await connection.query(
        `INSERT INTO users (
          username, 
          password, 
          email, 
          is_admin, 
          admin_role, 
          admin_created_at, 
          created_at
        ) VALUES (?, ?, ?, TRUE, ?, NOW(), NOW())`,
        ['admin', passwordHash, 'admin@example.com', 'super_admin']
      );
      
      console.log('✅ 已創建默認管理員：');
      console.log({
        username: 'admin',
        email: 'admin@example.com',
        role: 'super_admin',
        password: DEFAULT_PASSWORD
      });
    }
  } catch (error) {
    console.error('重置密碼過程中發生錯誤:', error);
  } finally {
    await connection.end();
    console.log('\n密碼重置完成。');
  }
}

// 執行重置操作
resetAdminPassword().catch(console.error); 