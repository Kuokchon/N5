/**
 * 測試管理員登錄功能
 * 
 * 此腳本用於直接測試管理員驗證功能，繞過API路由，找出具體問題
 */

const admin_model = require('./models/admin_model');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// 測試參數
const TEST_USERNAME = 'mklemona';
const TEST_EMAIL = 'mklemona@gmail.com';
const TEST_PASSWORD = 'admin123';

async function testAdminLogin() {
  console.log('開始測試管理員登錄功能...');
  
  try {
    // 測試1: 使用用戶名登錄
    console.log(`\n測試1: 使用用戶名 "${TEST_USERNAME}" 登錄`);
    const result1 = await admin_model.verify_admin_credentials(TEST_USERNAME, TEST_PASSWORD);
    
    if (result1) {
      console.log('✅ 用戶名登錄成功!');
      console.log('用戶信息:', result1);
    } else {
      console.error('❌ 用戶名登錄失敗!');
      
      // 嘗試查詢用戶信息
      const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'qwer8877',
        database: 'member_card_system'
      });
      
      const [users] = await connection.query(
        'SELECT id, username, email, password, is_admin, admin_role FROM users WHERE username = ?',
        [TEST_USERNAME]
      );
      
      if (users.length > 0) {
        const user = users[0];
        console.log('數據庫中的用戶信息:', {
          id: user.id,
          username: user.username,
          email: user.email,
          is_admin: user.is_admin === 1 ? true : false,
          admin_role: user.admin_role,
          has_password: !!user.password
        });
        
        // 直接測試密碼
        if (user.password) {
          try {
            const passwordMatch = await bcrypt.compare(TEST_PASSWORD, user.password);
            console.log(`密碼驗證結果: ${passwordMatch ? '成功' : '失敗'}`);
          } catch (e) {
            console.error('密碼驗證拋出異常:', e);
            console.log('密碼哈希值:', user.password);
          }
        } else {
          console.error('用戶密碼為空!');
        }
      } else {
        console.error(`用戶 "${TEST_USERNAME}" 不存在!`);
      }
      
      await connection.end();
    }
    
    // 測試2: 使用郵箱登錄
    console.log(`\n測試2: 使用郵箱 "${TEST_EMAIL}" 登錄`);
    const result2 = await admin_model.verify_admin_credentials(TEST_EMAIL, TEST_PASSWORD);
    
    if (result2) {
      console.log('✅ 郵箱登錄成功!');
      console.log('用戶信息:', result2);
    } else {
      console.error('❌ 郵箱登錄失敗!');
    }
    
    // 測試3: 檢查環境變量
    console.log('\n測試3: 檢查環境變量');
    console.log('JWT_SECRET:', process.env.JWT_SECRET || '未設置');
    console.log('MYSQL_HOST:', process.env.MYSQL_HOST || '未設置');
    console.log('MYSQL_USER:', process.env.MYSQL_USER || '未設置');
    console.log('MYSQL_DATABASE:', process.env.MYSQL_DATABASE || '未設置');
    
  } catch (error) {
    console.error('測試過程中發生錯誤:', error);
  }
  
  console.log('\n測試完成。');
}

// 執行測試
testAdminLogin().catch(console.error); 