/**
 * 自动化API测试工具
 * 根据测试用例批量测试API接口
 */

const axios = require('axios');
const testCases = require('./api_test_cases');
const colors = require('colors/safe');

// 配置
const config = {
  baseUrl: 'http://localhost:3000/',
  logLevel: 'verbose', // 'verbose' | 'minimal' | 'error'
};

// 创建axios实例
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 保存登录后的token
let authToken = null;

// 设置认证令牌
const set_auth_token = (token) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// 日志输出函数
const log = {
  info: (message) => {
    if (config.logLevel === 'verbose') {
      console.log(colors.blue(message));
    }
  },
  success: (message) => {
    console.log(colors.green(message));
  },
  warning: (message) => {
    console.log(colors.yellow(message));
  },
  error: (message) => {
    console.error(colors.red(message));
  },
  result: (message) => {
    if (config.logLevel !== 'error') {
      console.log(colors.cyan(message));
    }
  }
};

// 测试结果统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0
};

// 执行单个测试用例
const run_test_case = async (endpoint, method, testCase) => {
  stats.total++;
  
  log.info(`\n测试: ${testCase.description}`);
  
  // 检查前置条件
  if (testCase.beforeTest) {
    try {
      await testCase.beforeTest(api);
    } catch (error) {
      log.error(`前置条件失败: ${error.message}`);
      stats.skipped++;
      return false;
    }
  }
  
  try {
    // 准备请求参数
    const options = {};
    
    // 添加查询参数
    if (testCase.queryParams) {
      options.params = testCase.queryParams;
    }
    
    // 替换路径参数
    let url = endpoint;
    if (testCase.pathParams) {
      Object.keys(testCase.pathParams).forEach(key => {
        url = url.replace(`:${key}`, testCase.pathParams[key]);
      });
    }
    
    // 发送请求
    log.info(`发送 ${method.toUpperCase()} 请求到 ${url}`);
    if (testCase.requestData) {
      log.info(`请求数据: ${JSON.stringify(testCase.requestData)}`);
    }
    
    const response = await api[method](url, testCase.requestData, options);
    
    // 检查响应状态码
    if (response.status === testCase.expectedStatus) {
      log.success(`通过: 状态码匹配 (${response.status})`);
      
      // 检查响应数据（如果有指定）
      if (testCase.expectedResponse) {
        const matchesExpected = match_response(response.data, testCase.expectedResponse);
        if (matchesExpected) {
          log.success('通过: 响应数据匹配');
        } else {
          log.error('失败: 响应数据不匹配');
          log.error(`预期: ${JSON.stringify(testCase.expectedResponse)}`);
          log.error(`实际: ${JSON.stringify(response.data)}`);
          stats.failed++;
          return false;
        }
      }
      
      // 检查后置条件
      if (testCase.afterTest) {
        try {
          await testCase.afterTest(api, response.data);
        } catch (error) {
          log.error(`后置条件失败: ${error.message}`);
          stats.failed++;
          return false;
        }
      }
      
      // 保存token（如果是登录接口）
      if (endpoint === '/auth/login' && method === 'post' && response.data.token) {
        set_auth_token(response.data.token);
        log.info('登录成功: 已保存认证令牌');
      }
      
      stats.passed++;
      return true;
    } else {
      log.error(`失败: 状态码不匹配 (预期 ${testCase.expectedStatus}, 实际 ${response.status})`);
      log.error(`响应数据: ${JSON.stringify(response.data)}`);
      stats.failed++;
      return false;
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === testCase.expectedStatus) {
        log.success(`通过: 状态码匹配 (${error.response.status})`);
        stats.passed++;
        return true;
      } else {
        log.error(`失败: 状态码不匹配 (预期 ${testCase.expectedStatus}, 实际 ${error.response.status})`);
        log.error(`响应数据: ${JSON.stringify(error.response.data)}`);
      }
    } else {
      log.error(`请求失败: ${error.message}`);
    }
    
    stats.failed++;
    return false;
  }
};

// 比较响应数据是否匹配预期
const match_response = (actual, expected) => {
  if (typeof expected === 'function') {
    return expected(actual);
  }
  
  if (typeof expected !== 'object' || expected === null) {
    return actual === expected;
  }
  
  // 递归检查对象
  return Object.keys(expected).every(key => {
    if (!actual.hasOwnProperty(key)) {
      return false;
    }
    
    if (typeof expected[key] === 'object' && expected[key] !== null) {
      return match_response(actual[key], expected[key]);
    }
    
    return actual[key] === expected[key];
  });
};

// 运行一组测试用例
const run_test_suite = async (name, endpoint, method, testCases) => {
  log.result(`\n====== 开始测试 ${name} ======`);
  
  for (const testCase of testCases) {
    await run_test_case(endpoint, method, testCase);
  }
  
  log.result(`====== 完成测试 ${name} ======`);
};

// 运行所有测试用例
const run_all_tests = async () => {
  log.result('开始自动化API测试');
  
  // 1. 用户注册测试
  await run_test_suite('用户注册', '/auth/register', 'post', testCases.auth.register);
  
  // 2. 用户登录测试
  await run_test_suite('用户登录', '/auth/login', 'post', testCases.auth.login);
  
  // 需要登录的接口测试
  if (authToken) {
    // 3. 会员卡充值测试
    await run_test_suite('会员卡充值', '/member-card/topup', 'post', testCases.memberCard.topup);
    
    // 4. 使用AI应用测试
    await run_test_suite('使用AI应用', '/member-card/use-app', 'post', testCases.memberCard.useApp);
    
    // 5. 获取交易记录测试
    await run_test_suite('获取交易记录', '/transactions', 'get', testCases.transaction.getTransactions);
    
    // 6. 获取AI应用列表测试
    await run_test_suite('获取AI应用列表', '/ai-apps', 'get', testCases.aiApp.getApps);
    
    // 7. 获取AI应用详情测试
    for (const testCase of testCases.aiApp.getAppDetails) {
      await run_test_case(`/ai-apps/${testCase.pathParams.appId}`, 'get', testCase);
    }
  } else {
    log.warning('登录失败，跳过需要认证的测试');
    stats.skipped += (
      testCases.memberCard.topup.length +
      testCases.memberCard.useApp.length +
      testCases.transaction.getTransactions.length +
      testCases.aiApp.getApps.length +
      testCases.aiApp.getAppDetails.length
    );
  }
  
  // 输出测试统计
  log.result('\n====== 测试结果汇总 ======');
  log.result(`总计: ${stats.total} 测试用例`);
  log.success(`通过: ${stats.passed} 测试用例`);
  log.error(`失败: ${stats.failed} 测试用例`);
  log.warning(`跳过: ${stats.skipped} 测试用例`);
  log.result(`通过率: ${Math.round((stats.passed / (stats.total - stats.skipped)) * 100)}%`);
};

// 启动测试
run_all_tests().catch(error => {
  log.error(`测试执行失败: ${error.message}`);
  console.error(error);
}); 