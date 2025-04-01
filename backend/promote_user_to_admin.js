/**
 * 將現有用戶提升為管理員
 * 
 * 此腳本用於將指定的用戶提升為管理員，或創建新的管理員用戶
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// 要提升為管理員的用戶ID或用戶名
const TARGET_USER = process.argv[2] || 'test_user'; 
const ADMIN_ROLE = process.argv[3] || 'super_admin'; // super_admin, operation, developer

async function promoteUserToAdmin() {
  console.log(`開始提升用戶 "${TARGET_USER}" 為管理員 (角色: ${ADMIN_ROLE})...`);
  
  // 創建數據庫連接
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qwer8877',
    database: 'member_card_system'
  });
  
  try {
    // 檢查用戶是否存在
    let [users] = await connection.query(
      'SELECT * FROM users WHERE username = ? OR id = ?',
      [TARGET_USER, isNaN(TARGET_USER) ? 0 : parseInt(TARGET_USER)]
    );
    
    if (users.length === 0) {
      console.log(`用戶 "${TARGET_USER}" 不存在，將創建新用戶...`);
      
      // 創建隨機密碼
      const password = Math.random().toString(36).slice(-8);
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // 創建新用戶
      const [result] = await connection.query(
        `INSERT INTO users (
          username, 
          password, 
          email, 
          is_admin, 
          admin_role, 
          admin_created_at, 
          created_at
        ) VALUES (?, ?, ?, TRUE, ?, NOW(), NOW())`,
        [
          TARGET_USER, 
          passwordHash, 
          `${TARGET_USER}@example.com`, 
          ADMIN_ROLE
        ]
      );
      
      console.log(`✅ 已創建新管理員用戶:`);
      console.log({
        id: result.insertId,
        username: TARGET_USER,
        email: `${TARGET_USER}@example.com`,
        role: ADMIN_ROLE,
        password: password // 僅用於測試環境顯示
      });
    } else {
      // 提升現有用戶為管理員
      const user = users[0];
      console.log(`找到用戶: ID=${user.id}, 用戶名=${user.username}`);
      
      // 更新用戶為管理員
      await connection.query(
        `UPDATE users 
         SET is_admin = TRUE, 
             admin_role = ?, 
             admin_created_at = NOW()
         WHERE id = ?`,
        [ADMIN_ROLE, user.id]
      );
      
      console.log(`✅ 已將用戶 "${user.username}" (ID: ${user.id}) 提升為管理員，角色: ${ADMIN_ROLE}`);
    }
    
    // 顯示所有管理員
    console.log('\n當前所有管理員用戶:');
    const [adminUsers] = await connection.query(
      `SELECT id, username, email, admin_role, admin_created_at, created_at
       FROM users
       WHERE is_admin = TRUE`
    );
    
    console.table(adminUsers);
  } catch (error) {
    console.error('執行過程中發生錯誤:', error);
  } finally {
    await connection.end();
    console.log('\n處理完成。');
  }
}

// 執行提升操作
promoteUserToAdmin().catch(console.error); 