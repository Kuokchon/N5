/**
 * 重設管理員密碼腳本
 * 
 * 此腳本用於重置管理員用戶的密碼
 * 當管理員無法登錄時使用
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function reset_admin_passwords() {
  console.log('開始重設管理員密碼...');
  
  const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  };
  
  // 要重設的管理員帳號和密碼
  const admins = [
    { username: 'admin', password: 'admin123', role: 'super_admin' },
    { username: 'operation', password: 'operation123', role: 'operation' },
    { username: 'developer', password: 'developer123', role: 'developer' }
  ];
  
  // 創建連接
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('數據庫連接成功');
    
    for (const admin of admins) {
      // 生成新的密碼哈希
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(admin.password, saltRounds);
      
      // 檢查用戶是否存在
      const [rows] = await connection.query(
        'SELECT id FROM admin_users WHERE username = ?',
        [admin.username]
      );
      
      if (rows.length > 0) {
        // 更新現有用戶的密碼
        await connection.query(
          'UPDATE admin_users SET password_hash = ? WHERE username = ?',
          [passwordHash, admin.username]
        );
        console.log(`✅ 已重設 ${admin.username} 的密碼`);
      } else {
        // 創建新用戶
        await connection.query(
          'INSERT INTO admin_users (username, password_hash, email, role) VALUES (?, ?, ?, ?)',
          [admin.username, passwordHash, `${admin.username}@example.com`, admin.role]
        );
        console.log(`✅ 已創建管理員帳號 ${admin.username}`);
      }
      
      // 輸出登錄信息
      console.log(`   用戶名: ${admin.username}`);
      console.log(`   密碼: ${admin.password}`);
      console.log(`   角色: ${admin.role}`);
      console.log('-------------------');
    }
    
    console.log('管理員密碼重設完成');
  } catch (error) {
    console.error('管理員密碼重設失敗:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('數據庫連接已關閉');
    }
  }
}

reset_admin_passwords(); 