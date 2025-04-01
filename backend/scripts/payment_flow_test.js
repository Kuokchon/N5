/**
 * 会员卡系统充值与扣费流程测试脚本
 * 
 * 本脚本用于测试会员卡系统的核心业务流程：
 * 1. 充值流程（正常与异常场景）
 * 2. 扣费流程（正常与异常场景）
 * 3. 高并发下的事务一致性
 * 4. 安全性测试
 * 
 * 使用方法：node payment_flow_test.js [测试类型]
 * 测试类型: normal-topup, cancel-topup, security, normal-deduct, 
 *         insufficient-balance, expired-card, concurrent, integration
 */

const axios = require('axios');
const crypto = require('crypto');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

// 配置
const API_BASE_URL = 'http://localhost:3000/';
const SECRET_KEY = 'test_payment_secret_key';  // 模拟支付平台密钥

// 数据库连接
let pool;

// 测试用户信息
let testUser = {
  id: null,
  email: `test_${Date.now()}@example.com`,
  password: 'Test1234',
  username: `test_user_${Date.now()}`
};

// 测试APP信息
const TEST_APP = {
  app_id: 'image_gen',
  price: 10.00
};

// 辅助函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const generatePaymentId = () => `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;

// 生成支付签名
const generateSignature = (data, secret = SECRET_KEY) => {
  const timestamp = Date.now();
  const payload = `${timestamp}|${data.amount}|${data.txid}|${secret}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  
  return {
    signature,
    timestamp,
    ...data
  };
};

/**
 * 初始化测试环境
 */
async function setup() {
  console.log('初始化测试环境...');
  
  // 创建数据库连接
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10
  });
  
  // 创建测试用户
  try {
    const registerRes = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    console.log(`测试用户创建成功: ID=${registerRes.data.user_id}`);
    testUser.id = registerRes.data.user_id;
    
    // 登录获取token
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${loginRes.data.token}`;
    console.log('登录成功，获取到认证token');
    
  } catch (error) {
    if (error.response && error.response.status === 400 && error.response.data.message.includes('已被注册')) {
      // 用户已存在，尝试登录
      const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${loginRes.data.token}`;
      testUser.id = loginRes.data.user.id;
      console.log('使用已存在用户登录成功');
    } else {
      console.error('设置测试环境失败:', error.response ? error.response.data : error.message);
      process.exit(1);
    }
  }
}

/**
 * 清理测试环境
 */
async function teardown() {
  console.log('清理测试环境...');
  if (pool) {
    await pool.end();
  }
  console.log('测试完成');
}

/**
 * 检查交易状态
 */
async function checkTransactionStatus(txid) {
  const response = await axios.get(`${API_BASE_URL}/transactions/order/${txid}`);
  return response.data.order;
}

/**
 * 获取会员卡余额
 */
async function getMemberCardBalance() {
  const response = await axios.get(`${API_BASE_URL}/member-card`);
  return response.data.card.balance;
}

/**
 * 测试场景1: 正常充值流程
 */
async function testNormalTopup() {
  console.log('\n===== 测试正常充值流程 =====');
  const initialBalance = await getMemberCardBalance();
  console.log(`初始余额: ${initialBalance}`);
  
  try {
    // 步骤1: 创建充值订单
    const amount = 100.00;
    console.log(`创建充值订单: ${amount}元`);
    const topupRes = await axios.post(`${API_BASE_URL}/member-card/topup`, { amount });
    const { order } = topupRes.data;
    console.log(`订单创建成功: ID=${order.transaction_id}, 第三方ID=${order.third_party_txid}`);
    
    // 步骤2: 模拟支付平台回调
    console.log('模拟支付平台回调...');
    const callbackData = generateSignature({
      txid: order.third_party_txid,
      amount: amount,
      status: 'completed'
    });
    
    const callbackRes = await axios.post(`${API_BASE_URL}/member-card/payment-callback`, callbackData);
    console.log('支付回调处理结果:', callbackRes.data);
    
    // 步骤3: 验证订单状态
    await delay(1000); // 等待异步处理
    const orderStatus = await checkTransactionStatus(order.third_party_txid);
    console.log(`订单状态: ${orderStatus.status}`);
    
    // 步骤4: 验证余额
    const newBalance = await getMemberCardBalance();
    console.log(`更新后余额: ${newBalance}元 (增加了${newBalance - initialBalance}元)`);
    
    // 验证
    if (orderStatus.status !== 'completed') {
      throw new Error(`订单状态错误: ${orderStatus.status}`);
    }
    if (Math.abs((newBalance - initialBalance) - amount) > 0.01) {
      throw new Error(`余额计算错误: ${newBalance} - ${initialBalance} != ${amount}`);
    }
    
    console.log('✅ 正常充值测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * 测试场景2: 支付中途取消
 */
async function testCancelTopup() {
  console.log('\n===== 测试支付中途取消 =====');
  const initialBalance = await getMemberCardBalance();
  console.log(`初始余额: ${initialBalance}`);
  
  try {
    // 步骤1: 创建充值订单
    const amount = 50.00;
    console.log(`创建充值订单: ${amount}元`);
    const topupRes = await axios.post(`${API_BASE_URL}/member-card/topup`, { amount });
    const { order } = topupRes.data;
    console.log(`订单创建成功: ID=${order.transaction_id}, 第三方ID=${order.third_party_txid}`);
    
    // 步骤2: 模拟用户未支付，关闭窗口
    console.log('模拟用户关闭支付窗口 (无回调)');
    
    // 步骤3: 验证订单状态保持pending
    await delay(2000);
    const orderStatus = await checkTransactionStatus(order.third_party_txid);
    console.log(`订单状态: ${orderStatus.status}`);
    
    // 步骤4: 验证余额未变
    const newBalance = await getMemberCardBalance();
    console.log(`当前余额: ${newBalance}元`);
    
    // 步骤5: 模拟24小时后系统自动扫描过期订单
    console.log('模拟系统扫描过期订单...');
    const connection = await pool.getConnection();
    try {
      // 将订单创建时间提前24小时
      await connection.query(
        'UPDATE transactions SET created_at = DATE_SUB(NOW(), INTERVAL 25 HOUR) WHERE third_party_txid = ?',
        [order.third_party_txid]
      );
      
      // 触发系统检查
      await axios.post(`${API_BASE_URL}/admin/check-expired-orders`, { 
        admin_token: 'test_admin_token' 
      });
      
    } finally {
      connection.release();
    }
    
    // 验证订单已标记为失败
    await delay(1000);
    const updatedStatus = await checkTransactionStatus(order.third_party_txid);
    console.log(`订单最终状态: ${updatedStatus.status}`);
    
    // 验证
    if (orderStatus.status !== 'pending') {
      throw new Error(`初始订单状态错误: ${orderStatus.status}`);
    }
    if (updatedStatus.status !== 'failed') {
      throw new Error(`过期订单处理错误: ${updatedStatus.status}`);
    }
    if (Math.abs(newBalance - initialBalance) > 0.01) {
      throw new Error(`余额不应该变化: ${newBalance} != ${initialBalance}`);
    }
    
    console.log('✅ 支付取消测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * 测试场景3: 防伪造支付回调
 */
async function testSecurityCheck() {
  console.log('\n===== 测试支付回调安全验证 =====');
  
  try {
    // 步骤1: 创建充值订单
    const amount = 200.00;
    console.log(`创建充值订单: ${amount}元`);
    const topupRes = await axios.post(`${API_BASE_URL}/member-card/topup`, { amount });
    const { order } = topupRes.data;
    console.log(`订单创建成功: ID=${order.transaction_id}, 第三方ID=${order.third_party_txid}`);
    
    // 步骤2: 模拟伪造回调 - 错误签名
    console.log('模拟伪造回调 (错误签名)');
    const fakeData = {
      txid: order.third_party_txid,
      amount: amount,
      status: 'completed',
      signature: 'fake_signature',
      timestamp: Date.now()
    };
    
    try {
      await axios.post(`${API_BASE_URL}/member-card/payment-callback`, fakeData);
      console.error('❌ 测试失败: 伪造回调请求被接受');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ 伪造签名被正确拒绝');
      } else {
        throw error;
      }
    }
    
    // 步骤3: 模拟伪造回调 - 修改金额
    console.log('模拟伪造回调 (修改金额)');
    const tamperedData = generateSignature({
      txid: order.third_party_txid,
      amount: amount * 2, // 篡改金额
      status: 'completed'
    });
    
    try {
      await axios.post(`${API_BASE_URL}/member-card/payment-callback`, tamperedData);
      console.error('❌ 测试失败: 篡改金额的请求被接受');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ 篡改金额被正确拒绝');
      } else {
        throw error;
      }
    }
    
    console.log('✅ 安全验证测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * 测试场景4: 正常扣费流程
 */
async function testNormalDeduct() {
  console.log('\n===== 测试正常扣费流程 =====');
  
  try {
    // 准备工作: 确保账户有足够余额
    const initialBalance = await getMemberCardBalance();
    if (initialBalance < TEST_APP.price) {
      // 先充值
      const amount = 100;
      console.log(`余额不足，先充值${amount}元`);
      const topupRes = await axios.post(`${API_BASE_URL}/member-card/topup`, { amount });
      
      // 处理支付
      const callbackData = generateSignature({
        txid: topupRes.data.order.third_party_txid,
        amount: amount,
        status: 'completed'
      });
      await axios.post(`${API_BASE_URL}/member-card/payment-callback`, callbackData);
      await delay(1000);
    }
    
    // 获取最新余额
    const balanceBeforeDeduct = await getMemberCardBalance();
    console.log(`当前余额: ${balanceBeforeDeduct}元`);
    
    // 步骤1: 检查应用价格和余额
    console.log(`检查应用: ${TEST_APP.app_id}, 价格: ${TEST_APP.price}元`);
    const checkRes = await axios.get(`${API_BASE_URL}/ai-apps/${TEST_APP.app_id}/check`);
    console.log('检查结果:', checkRes.data);
    
    if (!checkRes.data.can_use) {
      throw new Error(`无法使用应用: ${checkRes.data.error}`);
    }
    
    // 步骤2: 执行扣费
    console.log('执行扣费操作...');
    const deductRes = await axios.post(`${API_BASE_URL}/member-card/use-app`, {
      app_id: TEST_APP.app_id
    });
    console.log('扣费结果:', deductRes.data);
    
    // 步骤3: 验证余额变化
    const balanceAfterDeduct = await getMemberCardBalance();
    console.log(`扣费后余额: ${balanceAfterDeduct}元 (减少了${balanceBeforeDeduct - balanceAfterDeduct}元)`);
    
    // 验证
    if (!deductRes.data.success) {
      throw new Error('扣费操作失败');
    }
    if (Math.abs((balanceBeforeDeduct - balanceAfterDeduct) - TEST_APP.price) > 0.01) {
      throw new Error(`余额扣减错误: ${balanceBeforeDeduct} - ${balanceAfterDeduct} != ${TEST_APP.price}`);
    }
    
    console.log('✅ 正常扣费测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * 测试场景5: 余额不足
 */
async function testInsufficientBalance() {
  console.log('\n===== 测试余额不足场景 =====');
  
  try {
    // 步骤1: 设置低余额
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE member_cards SET balance = ? WHERE user_id = ?',
        [5.00, testUser.id]
      );
    } finally {
      connection.release();
    }
    
    const lowBalance = await getMemberCardBalance();
    console.log(`当前设置的低余额: ${lowBalance}元`);
    
    // 步骤2: 尝试使用价格较高的应用
    console.log(`尝试使用价格为${TEST_APP.price}元的应用...`);
    try {
      await axios.post(`${API_BASE_URL}/member-card/use-app`, {
        app_id: TEST_APP.app_id
      });
      console.error('❌ 测试失败: 余额不足却允许扣费');
    } catch (error) {
      if (error.response && error.response.status === 400 && 
          error.response.data.message.includes('余额不足')) {
        console.log('✅ 余额不足正确被拒绝');
      } else {
        throw error;
      }
    }
    
    // 验证余额未改变
    const currentBalance = await getMemberCardBalance();
    if (Math.abs(currentBalance - lowBalance) > 0.01) {
      throw new Error(`余额不应该变化: ${currentBalance} != ${lowBalance}`);
    }
    
    console.log('✅ 余额不足测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  } finally {
    // 恢复余额
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE member_cards SET balance = ? WHERE user_id = ?',
        [100.00, testUser.id]
      );
    } finally {
      connection.release();
    }
  }
}

/**
 * 测试场景6: 会员卡过期
 */
async function testExpiredCard() {
  console.log('\n===== 测试会员卡过期场景 =====');
  
  try {
    // 步骤1: 设置会员卡过期
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE member_cards SET expired_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE user_id = ?',
        [testUser.id]
      );
    } finally {
      connection.release();
    }
    
    // 步骤2: 尝试使用应用
    console.log('尝试使用已过期会员卡...');
    try {
      await axios.post(`${API_BASE_URL}/member-card/use-app`, {
        app_id: TEST_APP.app_id
      });
      console.error('❌ 测试失败: 过期会员卡却允许扣费');
    } catch (error) {
      if (error.response && error.response.status === 400 && 
          error.response.data.message.includes('已过期')) {
        console.log('✅ 过期会员卡正确被拒绝');
      } else {
        throw error;
      }
    }
    
    console.log('✅ 会员卡过期测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  } finally {
    // 恢复会员卡有效期
    const connection = await pool.getConnection();
    try {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      await connection.query(
        'UPDATE member_cards SET expired_at = ? WHERE user_id = ?',
        [expiryDate, testUser.id]
      );
    } finally {
      connection.release();
    }
  }
}

/**
 * 测试场景7: 并发扣费
 */
async function testConcurrentDeduct() {
  console.log('\n===== 测试并发扣费场景 =====');
  
  try {
    // 步骤1: 设置精确余额
    const exactAmount = 100.00;
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE member_cards SET balance = ? WHERE user_id = ?',
        [exactAmount, testUser.id]
      );
    } finally {
      connection.release();
    }
    
    const initialBalance = await getMemberCardBalance();
    console.log(`初始余额设置为: ${initialBalance}元`);
    
    // 步骤2: 并发发送10个扣费请求，每次扣费10元
    const concurrentRequests = 15; // 多于余额允许的次数
    console.log(`发起${concurrentRequests}个并发扣费请求，每次${TEST_APP.price}元...`);
    
    const promises = [];
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(axios.post(`${API_BASE_URL}/member-card/use-app`, {
        app_id: TEST_APP.app_id
      }).catch(error => error.response));
    }
    
    const results = await Promise.all(promises);
    
    // 步骤3: 分析结果
    const successCount = results.filter(res => res.status === 200).length;
    const failCount = results.filter(res => res.status !== 200).length;
    
    console.log(`成功扣费次数: ${successCount}`);
    console.log(`失败扣费次数: ${failCount}`);
    
    // 步骤4: 检查最终余额
    const finalBalance = await getMemberCardBalance();
    console.log(`最终余额: ${finalBalance}元`);
    
    // 验证
    const expectedSuccesses = Math.floor(exactAmount / TEST_APP.price);
    if (successCount !== expectedSuccesses) {
      throw new Error(`成功扣费次数不匹配: ${successCount} !== ${expectedSuccesses}`);
    }
    
    if (finalBalance > 0.01) {
      throw new Error(`最终余额异常: ${finalBalance} > 0`);
    }
    
    console.log('✅ 并发扣费测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * 测试场景8: 充值后立即消费
 */
async function testIntegrationFlow() {
  console.log('\n===== 测试充值后立即消费场景 =====');
  
  try {
    // 步骤1: 设置初始余额为0
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'UPDATE member_cards SET balance = ? WHERE user_id = ?',
        [0.00, testUser.id]
      );
    } finally {
      connection.release();
    }
    
    const initialBalance = await getMemberCardBalance();
    console.log(`初始余额: ${initialBalance}元`);
    
    // 步骤2: 充值100元
    const topupAmount = 100.00;
    console.log(`创建充值订单: ${topupAmount}元`);
    const topupRes = await axios.post(`${API_BASE_URL}/member-card/topup`, { amount: topupAmount });
    const { order } = topupRes.data;
    
    // 步骤3: 处理支付回调
    console.log('处理支付回调...');
    const callbackData = generateSignature({
      txid: order.third_party_txid,
      amount: topupAmount,
      status: 'completed'
    });
    await axios.post(`${API_BASE_URL}/member-card/payment-callback`, callbackData);
    
    // 等待余额更新
    await delay(500);
    const balanceAfterTopup = await getMemberCardBalance();
    console.log(`充值后余额: ${balanceAfterTopup}元`);
    
    // 步骤4: 立即发起5次扣费请求，每次20元
    const deductCount = 5;
    const deductAmount = 20.00;
    
    // 设置特定的应用价格为20元
    const testAppId = 'data_analysis'; // 假设这个应用价格更高
    
    console.log(`立即发起${deductCount}次扣费请求，每次${deductAmount}元...`);
    const startTime = Date.now();
    
    const promises = [];
    for (let i = 0; i < deductCount; i++) {
      promises.push(axios.post(`${API_BASE_URL}/member-card/use-app`, {
        app_id: testAppId
      }).catch(error => {
        console.log(`请求${i+1}失败:`, error.response ? error.response.data.message : error.message);
        return error.response;
      }));
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    // 步骤5: 检查结果
    const successCount = results.filter(res => res && res.status === 200).length;
    console.log(`成功扣费次数: ${successCount}`);
    console.log(`操作总耗时: ${(endTime - startTime) / 1000}秒`);
    
    // 步骤6: 检查最终余额
    const finalBalance = await getMemberCardBalance();
    console.log(`最终余额: ${finalBalance}元`);
    
    // 步骤7: 验证交易记录
    const txResponse = await axios.get(`${API_BASE_URL}/transactions`);
    const topupTx = txResponse.data.transactions.filter(tx => tx.type === 'topup' && tx.amount == topupAmount);
    const deductTx = txResponse.data.transactions.filter(tx => tx.type === 'deduction');
    
    console.log(`充值交易记录数: ${topupTx.length}`);
    console.log(`扣费交易记录数: ${deductTx.length}`);
    
    // 验证
    if (successCount !== Math.floor(topupAmount / deductAmount)) {
      throw new Error(`成功扣费次数不符预期: ${successCount} !== ${Math.floor(topupAmount / deductAmount)}`);
    }
    
    if (Math.abs(finalBalance) > 0.01) {
      throw new Error(`最终余额应为0: ${finalBalance}`);
    }
    
    if ((endTime - startTime) > 3000) {
      throw new Error(`操作耗时过长: ${(endTime - startTime) / 1000}秒 > 3秒`);
    }
    
    console.log('✅ 充值后立即消费测试通过');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    const testType = process.argv[2] || 'all';
    
    await setup();
    
    switch(testType) {
      case 'normal-topup':
        await testNormalTopup();
        break;
      case 'cancel-topup':
        await testCancelTopup();
        break;
      case 'security':
        await testSecurityCheck();
        break;
      case 'normal-deduct':
        await testNormalDeduct();
        break;
      case 'insufficient-balance':
        await testInsufficientBalance();
        break;
      case 'expired-card':
        await testExpiredCard();
        break;
      case 'concurrent':
        await testConcurrentDeduct();
        break;
      case 'integration':
        await testIntegrationFlow();
        break;
      case 'all':
      default:
        await testNormalTopup();
        await testCancelTopup();
        await testSecurityCheck();
        await testNormalDeduct();
        await testInsufficientBalance();
        await testExpiredCard();
        await testConcurrentDeduct();
        await testIntegrationFlow();
        break;
    }
  } catch (error) {
    console.error('测试执行失败:', error);
  } finally {
    await teardown();
  }
}

main(); 