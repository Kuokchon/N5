const axios = require('axios');
const readline = require('readline');
const util = require('util');

const BASE_URL = 'http://localhost:3000/';
let token = null;
let user = null;

// 创建交互式命令行界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 将readline.question转换为Promise
const question = util.promisify((query, callback) => {
  rl.question(query, callback);
});

// 设置axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 统一处理请求响应并打印结果
const handleResponse = (response) => {
  console.log('\n响应状态码:', response.status);
  console.log('响应数据:');
  console.log(JSON.stringify(response.data, null, 2));
  console.log('----------------------------');
  return response.data;
};

// 统一处理错误
const handleError = (error) => {
  console.error('\n请求错误:');
  if (error.response) {
    console.error('状态码:', error.response.status);
    console.error('响应数据:', error.response.data);
  } else if (error.request) {
    console.error('未收到响应，请检查服务器是否运行');
  } else {
    console.error('错误信息:', error.message);
  }
  console.log('----------------------------');
  return null;
};

// 设置认证令牌
const setAuthToken = (newToken) => {
  token = newToken;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 测试用例

// 1. 用户注册
const testRegister = async () => {
  console.log('\n===== 测试用户注册 =====');
  
  const randomNum = Math.floor(Math.random() * 10000);
  const userData = {
    username: `测试用户${randomNum}`,
    email: `test${randomNum}@example.com`,
    password: 'password123'
  };
  
  console.log('请求数据:', userData);
  
  try {
    const response = await api.post('/auth/register', userData);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 2. 用户登录
const testLogin = async (email, password) => {
  console.log('\n===== 测试用户登录 =====');
  
  const loginData = {
    email: email || 'test@example.com',
    password: password || 'password123'
  };
  
  console.log('请求数据:', loginData);
  
  try {
    const response = await api.post('/auth/login', loginData);
    const data = handleResponse(response);
    
    if (data && data.token) {
      setAuthToken(data.token);
      user = data.user;
    }
    
    return data;
  } catch (error) {
    return handleError(error);
  }
};

// 3. 获取当前用户信息
const testGetCurrentUser = async () => {
  console.log('\n===== 测试获取当前用户信息 =====');
  
  try {
    const response = await api.get('/auth/me');
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 4. 获取会员卡详情
const testGetMemberCard = async () => {
  console.log('\n===== 测试获取会员卡详情 =====');
  
  try {
    const response = await api.get('/member-card');
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 5. 创建充值订单
const testCreateTopupOrder = async (amount) => {
  console.log('\n===== 测试创建充值订单 =====');
  
  const topupData = {
    amount: amount || 100
  };
  
  console.log('请求数据:', topupData);
  
  try {
    const response = await api.post('/member-card/topup', topupData);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 6. 获取AI应用列表
const testGetAIApps = async () => {
  console.log('\n===== 测试获取AI应用列表 =====');
  
  try {
    const response = await api.get('/ai-apps');
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 7. 获取应用详情
const testGetAppDetails = async (appId) => {
  console.log('\n===== 测试获取应用详情 =====');
  
  try {
    const response = await api.get(`/ai-apps/${appId}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 8. 使用AI应用并扣费
const testUseAIApp = async (appId) => {
  console.log('\n===== 测试使用AI应用并扣费 =====');
  
  const useAppData = {
    app_id: appId
  };
  
  console.log('请求数据:', useAppData);
  
  try {
    const response = await api.post('/member-card/use-app', useAppData);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 9. 获取交易记录
const testGetTransactions = async (page = 1, limit = 10) => {
  console.log('\n===== 测试获取交易记录 =====');
  
  try {
    const response = await api.get(`/transactions?page=${page}&limit=${limit}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 10. 获取交易详情
const testGetTransactionDetails = async (transactionId) => {
  console.log('\n===== 测试获取交易详情 =====');
  
  try {
    const response = await api.get(`/transactions/${transactionId}`);
    return handleResponse(response);
  } catch (error) {
    return handleError(error);
  }
};

// 显示测试菜单
const showMenu = async () => {
  console.log('\n======= API测试工具 =======');
  console.log('1. 用户注册');
  console.log('2. 用户登录');
  console.log('3. 获取当前用户信息');
  console.log('4. 获取会员卡详情');
  console.log('5. 创建充值订单');
  console.log('6. 获取AI应用列表');
  console.log('7. 获取应用详情');
  console.log('8. 使用AI应用并扣费');
  console.log('9. 获取交易记录');
  console.log('10. 获取交易详情');
  console.log('11. 运行全部测试');
  console.log('0. 退出');
  console.log('=========================');
  
  const answer = await question('请选择测试项目 (0-11): ');
  
  switch (answer.trim()) {
    case '1':
      await testRegister();
      break;
    case '2':
      const email = await question('输入邮箱 (默认 test@example.com): ');
      const password = await question('输入密码 (默认 password123): ');
      await testLogin(email || undefined, password || undefined);
      break;
    case '3':
      await testGetCurrentUser();
      break;
    case '4':
      await testGetMemberCard();
      break;
    case '5':
      const amount = await question('输入充值金额 (默认 100): ');
      await testCreateTopupOrder(amount ? Number(amount) : undefined);
      break;
    case '6':
      await testGetAIApps();
      break;
    case '7':
      const appId = await question('输入应用ID: ');
      await testGetAppDetails(appId);
      break;
    case '8':
      const useAppId = await question('输入应用ID: ');
      await testUseAIApp(useAppId);
      break;
    case '9':
      const page = await question('输入页码 (默认 1): ');
      const limit = await question('输入每页数量 (默认 10): ');
      await testGetTransactions(page ? Number(page) : undefined, limit ? Number(limit) : undefined);
      break;
    case '10':
      const txId = await question('输入交易ID: ');
      await testGetTransactionDetails(txId);
      break;
    case '11':
      await runAllTests();
      break;
    case '0':
      console.log('退出测试工具');
      rl.close();
      return;
    default:
      console.log('无效选择，请重新输入');
  }
  
  await showMenu();
};

// 运行全部测试
const runAllTests = async () => {
  console.log('\n===== 开始运行全部测试 =====');
  
  // 1. 注册新用户
  const registerResult = await testRegister();
  
  // 2. 使用新注册的用户登录
  let loginData;
  if (registerResult) {
    loginData = await testLogin(
      `test${Math.floor(Math.random() * 10000)}@example.com`, 
      'password123'
    );
  } else {
    loginData = await testLogin();
  }
  
  if (!token) {
    console.log('登录失败，无法继续后续测试');
    return;
  }
  
  // 3. 获取用户信息
  await testGetCurrentUser();
  
  // 4. 获取会员卡详情
  await testGetMemberCard();
  
  // 5. 创建充值订单
  const topupResult = await testCreateTopupOrder(100);
  
  // 6. 获取AI应用列表
  const appsResult = await testGetAIApps();
  
  // 7. 如果有应用，获取第一个应用详情
  let appId;
  if (appsResult && appsResult.apps && appsResult.apps.length > 0) {
    appId = appsResult.apps[0].id;
    await testGetAppDetails(appId);
    
    // 8. 使用此应用并扣费
    await testUseAIApp(appId);
  }
  
  // 9. 获取交易记录
  const txResult = await testGetTransactions();
  
  // 10. 如果有交易记录，获取第一条交易详情
  if (txResult && txResult.transactions && txResult.transactions.length > 0) {
    await testGetTransactionDetails(txResult.transactions[0].id);
  }
  
  console.log('\n===== 全部测试完成 =====');
};

// 启动测试工具
const startTestTool = async () => {
  console.log('会员卡系统 API 测试工具');
  console.log('=======================');
  
  await showMenu();
};

// 启动测试
startTestTool(); 