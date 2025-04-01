/**
 * API测试用例数据
 * 提供各种接口的测试数据和预期结果
 */

module.exports = {
  // 用户相关测试用例
  auth: {
    // 注册测试用例
    register: [
      {
        description: '正常注册',
        requestData: {
          username: '测试用户001',
          email: 'test001@example.com',
          password: 'password123'
        },
        expectedStatus: 201
      },
      {
        description: '邮箱已存在',
        requestData: {
          username: '测试用户002',
          email: 'test001@example.com', // 重复邮箱
          password: 'password123'
        },
        expectedStatus: 400
      },
      {
        description: '用户名已存在',
        requestData: {
          username: '测试用户001', // 重复用户名
          email: 'test002@example.com',
          password: 'password123'
        },
        expectedStatus: 400
      },
      {
        description: '缺少必填字段',
        requestData: {
          username: '测试用户003',
          // 缺少email
          password: 'password123'
        },
        expectedStatus: 400
      }
    ],
    
    // 登录测试用例
    login: [
      {
        description: '正常登录',
        requestData: {
          email: 'test001@example.com',
          password: 'password123'
        },
        expectedStatus: 200
      },
      {
        description: '邮箱不存在',
        requestData: {
          email: 'nonexistent@example.com',
          password: 'password123'
        },
        expectedStatus: 401
      },
      {
        description: '密码错误',
        requestData: {
          email: 'test001@example.com',
          password: 'wrongpassword'
        },
        expectedStatus: 401
      }
    ]
  },
  
  // 会员卡相关测试用例
  memberCard: {
    // 充值测试用例
    topup: [
      {
        description: '正常充值',
        requestData: {
          amount: 100
        },
        expectedStatus: 200
      },
      {
        description: '无效金额（负数）',
        requestData: {
          amount: -50
        },
        expectedStatus: 400
      },
      {
        description: '无效金额（非数字）',
        requestData: {
          amount: 'abc'
        },
        expectedStatus: 400
      }
    ],
    
    // 使用AI应用测试用例
    useApp: [
      {
        description: '正常使用应用',
        requestData: {
          app_id: 1
        },
        expectedStatus: 200
      },
      {
        description: '应用不存在',
        requestData: {
          app_id: 999
        },
        expectedStatus: 400
      },
      {
        description: '余额不足',
        beforeTest: async (api) => {
          // 可以在测试前做一些准备工作，如先消耗完余额
        },
        requestData: {
          app_id: 1
        },
        expectedStatus: 400
      }
    ]
  },
  
  // 交易记录相关测试用例
  transaction: {
    // 获取交易记录测试用例
    getTransactions: [
      {
        description: '默认分页',
        queryParams: {},
        expectedStatus: 200
      },
      {
        description: '自定义分页',
        queryParams: {
          page: 2,
          limit: 5
        },
        expectedStatus: 200
      }
    ]
  },
  
  // AI应用相关测试用例
  aiApp: {
    // 获取应用列表测试用例
    getApps: [
      {
        description: '获取全部应用',
        queryParams: {},
        expectedStatus: 200
      }
    ],
    
    // 获取应用详情测试用例
    getAppDetails: [
      {
        description: '正常获取应用详情',
        pathParams: {
          appId: 1
        },
        expectedStatus: 200
      },
      {
        description: '应用不存在',
        pathParams: {
          appId: 999
        },
        expectedStatus: 404
      }
    ]
  }
}; 