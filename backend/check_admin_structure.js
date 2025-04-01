/**
 * 檢查管理員用戶結構
 * 
 * 此腳本用於檢查用戶表中的管理員相關欄位和視圖是否正確設置
 */

const mysql = require('mysql2/promise');

async function checkAdminStructure() {
  console.log('開始檢查管理員結構...');
  
  // 創建數據庫連接
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'qwer8877',
    database: 'member_card_system'
  });
  
  try {
    // 1. 檢查用戶表中的管理員欄位
    console.log('\n1. 檢查users表中的管理員欄位:');
    const [columns] = await connection.query(`
      SHOW COLUMNS FROM users 
      WHERE Field IN ('is_admin', 'admin_role', 'admin_created_at')
    `);
    
    if (columns.length > 0) {
      console.log('✅ 用戶表中已存在管理員欄位:');
      columns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}, ${col.Null === 'YES' ? '可空' : '非空'}, 默認值: ${col.Default || '無'})`);
      });
    } else {
      console.error('❌ 用戶表中未找到管理員欄位!');
    }
    
    // 2. 檢查索引
    console.log('\n2. 檢查索引:');
    const [indexes] = await connection.query(`
      SHOW INDEX FROM users 
      WHERE Key_name IN ('idx_users_is_admin', 'idx_users_admin_role')
    `);
    
    if (indexes.length > 0) {
      console.log('✅ 已找到管理員相關索引:');
      const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
      uniqueIndexes.forEach(idxName => {
        console.log(`  - ${idxName}`);
      });
    } else {
      console.error('❌ 未找到管理員相關索引!');
    }
    
    // 3. 檢查視圖
    console.log('\n3. 檢查管理員視圖:');
    const [views] = await connection.query(`
      SHOW FULL TABLES
      WHERE Table_type = 'VIEW' AND Tables_in_member_card_system = 'admin_users_view'
    `);
    
    if (views.length > 0) {
      console.log('✅ 已找到管理員視圖:');
      console.log(`  - admin_users_view`);
      
      // 查看視圖內容
      const [viewData] = await connection.query('SELECT * FROM admin_users_view LIMIT 5');
      console.log(`\n視圖數據 (最多5筆):`);
      console.table(viewData);
    } else {
      console.error('❌ 未找到管理員視圖!');
    }
    
    // 4. 檢查管理員用戶
    console.log('\n4. 檢查管理員用戶:');
    const [adminUsers] = await connection.query(`
      SELECT id, username, email, admin_role, admin_created_at, created_at
      FROM users
      WHERE is_admin = TRUE
    `);
    
    if (adminUsers.length > 0) {
      console.log(`✅ 找到 ${adminUsers.length} 個管理員用戶:`);
      console.table(adminUsers);
    } else {
      console.error('❌ 未找到管理員用戶!');
    }
    
  } catch (error) {
    console.error('檢查過程中發生錯誤:', error);
  } finally {
    await connection.end();
    console.log('\n檢查完成。');
  }
}

// 執行檢查
checkAdminStructure().catch(console.error); 