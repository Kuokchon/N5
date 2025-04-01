/**
 * 測試管理員API接口
 * 
 * 這個腳本用於測試管理員登錄和獲取信息的API接口
 */

const axios = require('axios');

// 設置基本URL
const API_URL = 'http://localhost:3000/api';
let adminToken = null;

// 測試管理員登錄
async function testAdminLogin() {
  try {
    console.log('測試管理員登錄API...');
    
    const response = await axios.post(`${API_URL}/admin/login`, {
      username: 'admin', // 或使用其他管理員賬號
      password: 'admin123'
    });
    
    console.log('API響應狀態碼:', response.status);
    console.log('API響應頭部:', {
      'content-type': response.headers['content-type'],
      'content-length': response.headers['content-length']
    });
    
    // 獲取響應數據的摘要（避免輸出太多內容）
    const responseData = response.data;
    console.log('響應數據概要:', {
      hasToken: !!responseData.token,
      tokenLength: responseData.token?.length,
      hasAdmin: !!responseData.admin,
      adminInfo: responseData.admin ? {
        id: responseData.admin.id,
        username: responseData.admin.username,
        email: responseData.admin.email,
        role: responseData.admin.role
      } : null
    });
    
    // 保存token用於後續測試
    if (responseData.token) {
      adminToken = responseData.token;
      console.log('✅ 管理員登錄成功!');
      return true;
    } else {
      console.error('❌ 管理員登錄失敗: 響應中沒有token');
      return false;
    }
  } catch (error) {
    console.error('❌ 管理員登錄請求失敗:');
    
    if (error.response) {
      // 服務器響應了錯誤狀態碼
      console.error('狀態碼:', error.response.status);
      console.error('響應數據:', error.response.data);
      console.error('響應頭部:', error.response.headers);
    } else if (error.request) {
      // 請求已發送，但沒有收到響應
      console.error('沒有收到響應，請檢查服務器是否運行');
    } else {
      // 設置請求時發生錯誤
      console.error('錯誤信息:', error.message);
    }
    
    console.error('錯誤詳情:', error.stack);
    return false;
  }
}

// 測試獲取管理員信息
async function testGetAdminInfo() {
  if (!adminToken) {
    console.error('❌ 無法測試管理員信息API: 沒有有效的token');
    return false;
  }
  
  try {
    console.log('\n測試獲取管理員信息API...');
    
    const response = await axios.get(`${API_URL}/admin/me`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    
    console.log('API響應狀態碼:', response.status);
    
    // 獲取響應數據
    const adminInfo = response.data;
    console.log('管理員信息:', adminInfo);
    
    console.log('✅ 獲取管理員信息成功!');
    return true;
  } catch (error) {
    console.error('❌ 獲取管理員信息請求失敗:');
    
    if (error.response) {
      console.error('狀態碼:', error.response.status);
      console.error('響應數據:', error.response.data);
    } else if (error.request) {
      console.error('沒有收到響應');
    } else {
      console.error('錯誤信息:', error.message);
    }
    
    return false;
  }
}

// 運行測試
async function runTests() {
  console.log('======= 開始管理員API測試 =======');
  console.log('API URL:', API_URL);
  console.log('時間戳:', new Date().toISOString());
  console.log('Node.js版本:', process.version);
  console.log('===================================\n');
  
  // 測試管理員登錄
  const loginSuccess = await testAdminLogin();
  
  if (loginSuccess) {
    // 如果登錄成功，測試獲取管理員信息
    await testGetAdminInfo();
  }
  
  console.log('\n======= 測試完成 =======');
}

// 執行測試
runTests().catch(err => {
  console.error('運行測試時發生未捕獲的錯誤:', err);
}); 