/**
 * 將特定用戶提升為管理員
 * 
 * 此腳本專門用於將ID為17的用戶提升為管理員
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const USER_ID = 17; // 要提升的用戶ID
const ADMIN_ROLE = 'super_admin'; // 管理員角色
const RESET_PASSWORD = true; // 是否重置密碼
const NEW_PASSWORD = 'admin123'; // 新密碼

async function promoteSpecificUser() {
  console.log(`開始將ID為 ${USER_ID} 的用戶提升為管理員...`);
  
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
    console.log(`找到用戶: ID=${user.id}, 用戶名=${user.username}, 郵箱=${user.email || '無'}, 手機=${user.phone || '無'}`);
    
    // 準備更新數據
    let updateFields = {
      is_admin: true,
      admin_role: ADMIN_ROLE,
      admin_created_at: new Date()
    };
    
    // 如果需要重置密碼
    if (RESET_PASSWORD) {
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
      updateFields.password = passwordHash;
    }
    
    // 構建SQL更新語句
    const fields = Object.keys(updateFields);
    const placeholders = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updateFields[f]);
    values.push(USER_ID); // 添加WHERE條件的參數
    
    // 執行更新
    const [result] = await connection.query(
      `UPDATE users SET ${placeholders} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ 已成功將用戶 "${user.username}" (ID: ${user.id}) 提升為 ${ADMIN_ROLE} 管理員!`);
      if (RESET_PASSWORD) {
        console.log(`✅ 密碼已重置為: ${NEW_PASSWORD}`);
      }
    } else {
      console.error('❌ 更新失敗，沒有記錄被修改');
    }
    
    // 顯示所有管理員
    console.log('\n當前所有管理員用戶:');
    const [adminUsers] = await connection.query(
      `SELECT id, username, email, phone, admin_role, admin_created_at
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
promoteSpecificUser().catch(console.error); 