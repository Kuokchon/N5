/**
 * 直接測試模型函數
 * 
 * 繞過API直接測試模型功能，幫助診斷問題
 */

const bcrypt = require('bcryptjs');
const adminModel = require('./models/admin_model');
const mysql = require('mysql2/promise');
const config = require('./config/config');

async function testDbConnection() {
  try {
    console.log('== 測試數據庫連接 ==');
    const pool = require('./config/mysql');
    
    // 執行簡單查詢測試連接
    const [rows] = await pool.query('SELECT 1 as test');
    
    if (rows && rows[0] && rows[0].test === 1) {
      console.log('✓ 數據庫連接成功!');
      return true;
    } else {
      console.error('✗ 數據庫連接失敗: 返回意外結果');
      return false;
    }
  } catch (error) {
    console.error('✗ 數據庫連接出錯:', error.message);
    return false;
  }
}

async function testAdminModel() {
  try {
    console.log('\n== 測試管理員模型 ==');
    console.log('管理員角色定義:', adminModel.ADMIN_ROLES);
    
    // 測試方法存在性
    const methods = [
      'get_admin_list',
      'get_admin_by_id',
      'get_admin_by_username',
      'verify_admin_credentials',
      'is_admin',
      'has_permission'
    ];
    
    for (const method of methods) {
      if (typeof adminModel[method] === 'function') {
        console.log(`✓ 方法 ${method} 存在`);
      } else {
        console.error(`✗ 方法 ${method} 不存在或不是函數`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('測試管理員模型時出錯:', error);
    return false;
  }
}

async function testAdminModelGetMethods() {
  try {
    console.log('\n== 測試管理員獲取方法 ==');
    
    // 嘗試獲取管理員列表
    const adminList = await adminModel.get_admin_list();
    console.log(`獲取到 ${adminList.total} 個管理員用戶`);
    
    if (adminList.items.length > 0) {
      const firstAdmin = adminList.items[0];
      console.log('第一個管理員:', {
        id: firstAdmin.id,
        username: firstAdmin.username,
        email: firstAdmin.email,
        role: firstAdmin.role
      });
      
      // 測試按ID獲取
      const adminById = await adminModel.get_admin_by_id(firstAdmin.id);
      console.log(`按ID獲取: ${adminById ? '成功' : '失敗'}`);
      
      // 測試按用戶名獲取
      const adminByUsername = await adminModel.get_admin_by_username(firstAdmin.username);
      console.log(`按用戶名獲取: ${adminByUsername ? '成功' : '失敗'}`);
    }
    
    return true;
  } catch (error) {
    console.error('測試管理員獲取方法時出錯:', error);
    return false;
  }
}

async function testVerifyCredentials() {
  try {
    console.log('\n== 測試管理員憑據驗證 ==');
    
    const testCases = [
      { username: 'admin', password: 'admin123', expected: true, desc: '默認管理員' },
      { username: 'mklemona', password: 'admin123', expected: true, desc: '已提升的用戶' },
      { username: 'nonexistent', password: 'wrongpass', expected: false, desc: '不存在的用戶' },
      { username: 'admin', password: 'wrongpass', expected: false, desc: '錯誤密碼' }
    ];
    
    for (const test of testCases) {
      console.log(`\n測試案例: ${test.desc}`);
      
      try {
        const admin = await adminModel.verify_admin_credentials(test.username, test.password);
        
        if (admin) {
          console.log('✓ 驗證成功:', {
            id: admin.id,
            username: admin.username,
            role: admin.role
          });
          
          if (!test.expected) {
            console.error('✗ 預期失敗但實際成功');
          }
        } else {
          console.log('✗ 驗證失敗: 返回null');
          
          if (test.expected) {
            console.error('✗ 預期成功但實際失敗');
            
            // 查看用戶是否存在
            try {
              const pool = require('./config/mysql');
              const [rows] = await pool.query(
                'SELECT id, username, email, password, is_admin, admin_role FROM users WHERE username = ?',
                [test.username]
              );
              
              if (rows && rows.length > 0) {
                const user = rows[0];
                console.log('用戶存在於數據庫:', {
                  id: user.id,
                  username: user.username,
                  is_admin: !!user.is_admin,
                  admin_role: user.admin_role,
                  has_password: !!user.password
                });
                
                // 手動比較密碼
                if (user.password) {
                  const match = await bcrypt.compare(test.password, user.password);
                  console.log(`密碼比較結果: ${match ? '匹配' : '不匹配'}`);
                } else {
                  console.log('用戶密碼為空');
                }
              } else {
                console.log(`用戶 ${test.username} 不存在於數據庫`);
              }
            } catch (e) {
              console.error('查詢用戶時出錯:', e.message);
            }
          }
        }
      } catch (error) {
        console.error('驗證過程中拋出錯誤:', error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('測試憑據驗證時出錯:', error);
    return false;
  }
}

// 主測試函數
async function runTests() {
  console.log('===== 開始直接模型測試 =====');
  console.log('Node.js版本:', process.version);
  console.log('bcrypt版本:', require('bcryptjs/package.json').version);
  console.log('mysql2版本:', require('mysql2/package.json').version);
  console.log('===========================\n');
  
  const dbConnected = await testDbConnection();
  
  if (dbConnected) {
    await testAdminModel();
    await testAdminModelGetMethods();
    await testVerifyCredentials();
  }
  
  console.log('\n===== 測試完成 =====');
}

// 運行測試
runTests().catch(err => {
  console.error('執行測試時發生未捕獲的錯誤:', err);
}).finally(() => {
  // 確保程序退出
  setTimeout(() => process.exit(), 1000);
}); 