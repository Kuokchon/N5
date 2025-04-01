/**
 * 管理員登錄API調試腳本
 * 
 * 用於測試管理員登錄功能，診斷500錯誤
 */

const axios = require('axios');
const adminModel = require('./models/admin_model');
const config = require('./config/config');
const db = require('./config/mysql');

// 測試管理員登錄API
async function testAdminLoginAPI() {
  try {
    console.log('嘗試通過API測試管理員登錄...');
    
    const response = await axios.post('http://localhost:3000/api/admin/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('API響應:', response.data);
    return response.data;
  } catch (error) {
    console.error('API測試失敗:', error.message);
    if (error.response) {
      console.error('錯誤狀態碼:', error.response.status);
      console.error('錯誤數據:', error.response.data);
    }
    return null;
  }
}

// 直接測試管理員驗證函數
async function testAdminCredentials() {
  try {
    console.log('嘗試直接測試管理員驗證...');
    console.log('MySQL連接配置:', {
      host: db.pool.pool.config.connectionConfig.host,
      user: db.pool.pool.config.connectionConfig.user,
      database: db.pool.pool.config.connectionConfig.database
    });
    
    const admin = await adminModel.verify_admin_credentials('admin', 'admin123');
    
    if (admin) {
      console.log('管理員驗證成功:', admin);
    } else {
      console.log('管理員驗證失敗: 憑據無效');
    }
    
    return admin;
  } catch (error) {
    console.error('管理員驗證測試失敗:', error);
    return null;
  }
}

// 測試環境變量和配置
function checkEnvironment() {
  console.log('=== 環境檢查 ===');
  console.log('Node.js版本:', process.version);
  console.log('JWT密鑰配置:', config.jwtSecret ? '已配置' : '未配置');
  console.log('MySQL配置:', db.pool ? '已配置' : '未配置');
  
  // 檢查是否使用硬編碼的MySQL配置
  try {
    const mysqlConfigSource = require('fs').readFileSync('./config/mysql.js', 'utf8');
    const hasHardcodedConfig = mysqlConfigSource.includes('host:') && 
                              mysqlConfigSource.includes('user:') && 
                              mysqlConfigSource.includes('password:');
    
    console.log('是否使用硬編碼MySQL配置:', hasHardcodedConfig ? '是' : '否');
    
    if (!hasHardcodedConfig) {
      console.log('環境變量:');
      console.log('  MYSQL_HOST:', process.env.MYSQL_HOST || '未設置');
      console.log('  MYSQL_USER:', process.env.MYSQL_USER || '未設置');
      console.log('  MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '已設置' : '未設置');
      console.log('  MYSQL_DATABASE:', process.env.MYSQL_DATABASE || '未設置');
    }
  } catch (err) {
    console.log('無法讀取MySQL配置文件', err.message);
  }
}

// 執行測試
async function runTests() {
  console.log('=== 開始管理員登錄API診斷 ===');
  
  // 1. 檢查環境
  checkEnvironment();
  
  // 2. 測試數據庫連接
  try {
    console.log('\n=== 測試數據庫連接 ===');
    const [rows] = await db.query('SELECT 1 as test');
    console.log('數據庫連接成功:', rows);
  } catch (dbError) {
    console.error('數據庫連接失敗:', dbError);
    console.log('請檢查MySQL配置和數據庫服務是否運行');
    return;
  }
  
  // 3. 測試管理員表
  try {
    console.log('\n=== 查詢USERS表中的管理員 ===');
    const [admins] = await db.query('SELECT id, username, email, is_admin, admin_role FROM users WHERE is_admin = TRUE LIMIT 5');
    
    if (admins.length > 0) {
      console.log(`找到 ${admins.length} 個管理員:`);
      admins.forEach(admin => {
        console.log(`- ${admin.username} (${admin.email}), 角色: ${admin.admin_role}`);
      });
    } else {
      console.log('未找到管理員用戶, 請檢查數據庫或運行重置腳本');
    }
  } catch (tableError) {
    console.error('查詢管理員表失敗:', tableError);
  }
  
  // 4. 測試管理員驗證函數
  console.log('\n=== 測試管理員驗證函數 ===');
  await testAdminCredentials();
  
  // 5. 測試API
  console.log('\n=== 測試管理員登錄API ===');
  await testAdminLoginAPI();
  
  console.log('\n=== 診斷完成 ===');
}

// 執行診斷
runTests().catch(err => {
  console.error('執行診斷時出錯:', err);
}).finally(() => {
  // 關閉數據庫連接
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}); 