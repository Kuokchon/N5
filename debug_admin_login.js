/**
 * 管理員登錄API調試腳本
 * 
 * 用於測試管理員登錄功能，診斷500錯誤
 */

const axios = require('axios');
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

// 測試管理員表查詢
async function testAdminQuery() {
  try {
    console.log('測試管理員表查詢...');
    
    // 查詢管理員用戶
    const query = 'SELECT id, username, email, password, admin_role FROM users WHERE is_admin = TRUE AND (username = ? OR email = ?)';
    const [rows] = await db.query(query, ['admin', 'admin']);
    
    if (rows && rows.length > 0) {
      const admin = rows[0];
      console.log('找到管理員用戶:', admin.username);
      console.log('用戶ID:', admin.id);
      console.log('郵箱:', admin.email);
      console.log('角色:', admin.admin_role);
      console.log('密碼哈希長度:', admin.password ? admin.password.length : 0);
      
      return admin;
    } else {
      console.log('未找到admin用戶');
      
      // 嘗試查找其他管理員
      console.log('\n嘗試查找其他管理員...');
      const [allAdmins] = await db.query('SELECT id, username, email, admin_role FROM users WHERE is_admin = TRUE LIMIT 5');
      
      if (allAdmins && allAdmins.length > 0) {
        console.log(`共找到 ${allAdmins.length} 個管理員:`);
        allAdmins.forEach(admin => {
          console.log(`- ${admin.username} (${admin.email}), 角色: ${admin.admin_role}`);
        });
        
        // 返回第一個找到的管理員
        return allAdmins[0];
      } else {
        console.log('未找到任何管理員用戶');
      }
    }
    
    return null;
  } catch (error) {
    console.error('管理員查詢失敗:', error);
    return null;
  }
}

// 測試環境變量和配置
function checkEnvironment() {
  console.log('=== 環境檢查 ===');
  console.log('Node.js版本:', process.version);
  console.log('JWT密鑰配置:', config.jwtSecret ? '已配置' : '未配置');
  
  // 檢查是否使用硬編碼的MySQL配置
  try {
    const mysqlConfigSource = require('fs').readFileSync('./config/mysql.js', 'utf8');
    
    // 檢查配置文件內容
    if (mysqlConfigSource.includes('createPool')) {
      console.log('MySQL配置文件內容正確');
    } else {
      console.log('MySQL配置文件可能有問題');
    }
    
    console.log('環境變量:');
    console.log('  MYSQL_HOST:', process.env.MYSQL_HOST || '未設置');
    console.log('  MYSQL_USER:', process.env.MYSQL_USER || '未設置');
    console.log('  MYSQL_PASSWORD:', process.env.MYSQL_PASSWORD ? '已設置' : '未設置');
    console.log('  MYSQL_DATABASE:', process.env.MYSQL_DATABASE || '未設置');
  } catch (err) {
    console.log('無法讀取MySQL配置文件', err.message);
  }
}

// 測試密碼加密功能
async function testBcrypt() {
  try {
    const bcrypt = require('bcryptjs');
    
    console.log('測試bcrypt加密...');
    const testPassword = 'admin123';
    
    // 測試新密碼加密
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPassword, salt);
    
    console.log('密碼加密成功，長度:', hash.length);
    console.log('哈希示例:', hash.substring(0, 20) + '...');
    
    // 測試密碼驗證
    const isMatch = await bcrypt.compare(testPassword, hash);
    console.log('密碼驗證結果:', isMatch);
    
    return hash;
  } catch (error) {
    console.error('bcrypt測試失敗:', error);
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
  
  // 3. 測試管理員表查詢
  console.log('\n=== 測試管理員查詢 ===');
  const admin = await testAdminQuery();
  
  // 4. 測試bcrypt功能
  console.log('\n=== 測試密碼加密功能 ===');
  await testBcrypt();
  
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