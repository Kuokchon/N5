/**
 * 檢查管理員用戶腳本
 * 
 * 此腳本用於檢查數據庫中是否存在管理員用戶
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function check_admin_users() {
  console.log('開始檢查管理員用戶...');
  
  const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  };
  
  // 創建連接
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('數據庫連接成功');
    
    // 獲取所有管理員用戶
    const [rows] = await connection.query(
      'SELECT id, username, email, role, last_login_time, created_at FROM admin_users'
    );
    
    if (rows.length === 0) {
      console.log('⚠️ 數據庫中沒有管理員用戶');
    } else {
      console.log(`發現 ${rows.length} 個管理員用戶：`);
      
      for (const admin of rows) {
        console.log(`\n用戶 #${admin.id}:`);
        console.log(`  用戶名: ${admin.username}`);
        console.log(`  郵箱: ${admin.email}`);
        console.log(`  角色: ${admin.role}`);
        console.log(`  創建時間: ${admin.created_at}`);
        console.log(`  最後登錄時間: ${admin.last_login_time || '從未登錄'}`);
      }
    }
    
    // 檢查操作日誌表
    const [logRows] = await connection.query(
      'SELECT COUNT(*) as count FROM operation_logs'
    );
    
    console.log(`\n操作日誌數量：${logRows[0].count}`);
    
    console.log('\n檢查完成');
  } catch (error) {
    console.error('檢查管理員用戶失敗:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('數據庫連接已關閉');
    }
  }
}

check_admin_users(); 