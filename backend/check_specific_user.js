/**
 * 檢查特定用戶的狀態
 * 
 * 此腳本用於檢查ID為17的用戶是否已設置為管理員
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const USER_ID = 17; // 要檢查的用戶ID
const NEW_PASSWORD = 'admin123'; // 如果需要重置密碼

async function checkUserStatus() {
  console.log(`開始檢查ID為 ${USER_ID} 的用戶狀態...`);
  
  // 創建數據庫連接
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qwer8877',
    database: 'member_card_system'
  });
  
  try {
    // 檢查用戶是否存在
    const [users] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [USER_ID]
    );
    
    if (users.length === 0) {
      console.error(`❌ ID為 ${USER_ID} 的用戶不存在!`);
      return;
    }
    
    const user = users[0];
    console.log(`找到用戶: ID=${user.id}, 用戶名=${user.username}, 郵箱=${user.email || '無'}`);
    
    // 檢查用戶是否為管理員
    if (user.is_admin) {
      console.log(`✅ 用戶 "${user.username}" 已是管理員，角色為: ${user.admin_role}`);
    } else {
      console.log(`❌ 用戶 "${user.username}" 不是管理員`);
      
      // 提示是否需要將用戶提升為管理員
      console.log('如需將該用戶提升為管理員，請執行 node promote_specific_user.js');
    }
    
    // 重置用戶密碼
    console.log('\n正在重置用戶密碼...');
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
    
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [passwordHash, USER_ID]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ 已重置用戶 "${user.username}" 的密碼為: ${NEW_PASSWORD}`);
    } else {
      console.error('❌ 密碼重置失敗');
    }
    
    // 顯示所有管理員
    console.log('\n當前所有管理員用戶:');
    const [adminUsers] = await connection.query(
      `SELECT id, username, email, admin_role, admin_created_at
       FROM users
       WHERE is_admin = TRUE`
    );
    
    console.table(adminUsers);
  } catch (error) {
    console.error('執行過程中發生錯誤:', error);
  } finally {
    await connection.end();
    console.log('\n檢查完成。');
  }
}

// 執行檢查
checkUserStatus().catch(console.error); 