/**
 * API接口测试脚本
 * 可以测试后端所有主要接口功能
 */

const axios = require('axios');
const readline = require('readline');

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 配置
const config = {
  baseUrl: 'http://localhost:3000/',
  timeout: 10000
};

// 创建axios实例
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: config.timeout,
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
  console.log('✅ 令牌已设置成功！');
};

// 清除令牌
const clear_auth_token = () => {
  authToken = null;
  delete api.defaults.headers.common['Authorization'];
  console.log('✅ 令牌已清除！');
};

// 用户注册测试
const test_register = async () => {
  console.log('\n===== 测试用户注册 =====');
  
  // 生成随机用户名和邮箱以避免冲突
  const timestamp = Date.now();
  const username = `user_${timestamp}`;
  const email = `test_${timestamp}@example.com`;
  const password = 'Password123!';
  
  console.log(`用户名: ${username}`);
  console.log(`邮箱: ${email}`);
  console.log(`密码: ${password}`);
  
  try {
    const response = await api.post('/auth/register', {
      username,
      email,
      password
    });
    
    console.log('✅ 注册成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    
    return { email, password };
  } catch (error) {
    console.error('❌ 注册失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return null;
  }
};

// 用户登录测试
const test_login = async (email, password) => {
  console.log('\n===== 测试用户登录 =====');
  
  if (!email || !password) {
    email = await ask_question('请输入邮箱: ');
    password = await ask_question('请输入密码: ');
  } else {
    console.log(`使用注册时创建的账号登录: ${email}`);
  }
  
  try {
    const response = await api.post('/auth/login', {
      email,
      password
    });
    
    console.log('✅ 登录成功!');
    console.log('状态码:', response.status);
    console.log('用户信息:', response.data.user);
    
    // 保存token用于后续测试
    set_auth_token(response.data.token);
    
    return true;
  } catch (error) {
    console.error('❌ 登录失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取用户信息测试
const test_get_user_info = async () => {
  console.log('\n===== 测试获取用户信息 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  try {
    const response = await api.get('/auth/me');
    
    console.log('✅ 获取用户信息成功!');
    console.log('状态码:', response.status);
    console.log('用户信息:', response.data.user);
    
    return true;
  } catch (error) {
    console.error('❌ 获取用户信息失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取会员卡信息测试
const test_get_member_card = async () => {
  console.log('\n===== 测试获取会员卡信息 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  try {
    const response = await api.get('/member-card');
    
    console.log('✅ 获取会员卡信息成功!');
    console.log('状态码:', response.status);
    console.log('会员卡信息:', response.data.card);
    
    return true;
  } catch (error) {
    console.error('❌ 获取会员卡信息失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 创建充值订单测试
const test_create_topup_order = async () => {
  console.log('\n===== 测试创建充值订单 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  const amount = await ask_question('请输入充值金额: ');
  
  try {
    const response = await api.post('/member-card/topup', {
      amount: parseFloat(amount)
    });
    
    console.log('✅ 创建充值订单成功!');
    console.log('状态码:', response.status);
    console.log('订单信息:', response.data);
    
    // 返回订单ID，可用于后续的订单状态查询测试
    return response.data.txid;
  } catch (error) {
    console.error('❌ 创建充值订单失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return null;
  }
};

// 查询订单状态测试
const test_check_order_status = async (txid) => {
  console.log('\n===== 测试查询订单状态 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  if (!txid) {
    txid = await ask_question('请输入订单ID: ');
  } else {
    console.log(`使用刚创建的订单ID: ${txid}`);
  }
  
  try {
    const response = await api.get(`/transactions/order/${txid}`);
    
    console.log('✅ 查询订单状态成功!');
    console.log('状态码:', response.status);
    console.log('订单状态:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ 查询订单状态失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取交易记录测试
const test_get_transactions = async () => {
  console.log('\n===== 测试获取交易记录 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  try {
    const response = await api.get('/transactions');
    
    console.log('✅ 获取交易记录成功!');
    console.log('状态码:', response.status);
    console.log('交易记录数量:', response.data.transactions.length);
    console.log('前几条交易记录:', response.data.transactions.slice(0, 3));
    
    return true;
  } catch (error) {
    console.error('❌ 获取交易记录失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取AI应用列表测试
const test_get_ai_apps = async () => {
  console.log('\n===== 测试获取AI应用列表 =====');
  
  try {
    const response = await api.get('/ai-apps');
    
    console.log('✅ 获取AI应用列表成功!');
    console.log('状态码:', response.status);
    console.log('应用数量:', response.data.apps.length);
    console.log('应用列表:', response.data.apps);
    
    // 返回第一个应用的ID，用于后续测试
    return response.data.apps.length > 0 ? response.data.apps[0].id : null;
  } catch (error) {
    console.error('❌ 获取AI应用列表失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return null;
  }
};

// 使用AI应用测试
const test_use_ai_app = async (appId) => {
  console.log('\n===== 测试使用AI应用 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  if (!appId) {
    appId = await ask_question('请输入应用ID: ');
  } else {
    console.log(`使用获取到的应用ID: ${appId}`);
  }
  
  try {
    const response = await api.post('/member-card/use-app', {
      app_id: appId
    });
    
    console.log('✅ 使用AI应用成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ 使用AI应用失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 检查API服务是否在线
const test_api_status = async () => {
  console.log('\n===== 检查API服务状态 =====');
  
  try {
    // 将根路径从'/'改为'/auth/me'以更准确地测试API状态
    const response = await api.get('/auth/me', { 
      validateStatus: function (status) {
        // 任何状态码都被接受，包括401（未授权），因为我们只是测试API可用性
        return status < 500;
      }
    });
    
    console.log('✅ API服务在线!');
    console.log('状态码:', response.status);
    if (response.status === 401) {
      console.log('响应消息: 需要登录才能访问 (这是预期行为)');
    } else {
      console.log('响应消息:', response.data);
    }
    
    return true;
  } catch (error) {
    console.error('❌ API服务离线或无法访问!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
      console.error('请确保后端服务已启动并监听 http://localhost:3000');
    }
    return false;
  }
};

// 工具函数 - 等待用户输入
const ask_question = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// 获取用户头像测试
const test_get_avatar = async (userId) => {
  console.log('\n===== 测试获取用户头像 =====');
  
  if (!userId) {
    userId = await ask_question('请输入用户ID: ');
  } else {
    console.log(`使用当前用户ID: ${userId}`);
  }
  
  try {
    const response = await api.get(`/users/${userId}/avatar`);
    
    console.log('✅ 获取用户头像成功!');
    console.log('状态码:', response.status);
    console.log('头像URL:', response.data.avatar_url);
    
    return true;
  } catch (error) {
    console.error('❌ 获取用户头像失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 上传用户头像测试
const test_upload_avatar = async (userId) => {
  console.log('\n===== 测试上传用户头像 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  if (!userId) {
    userId = await ask_question('请输入用户ID: ');
  } else {
    console.log(`使用当前用户ID: ${userId}`);
  }
  
  console.log('注意: 此测试需要在项目根目录有public/default-avatar.png文件');
  
  try {
    // 创建FormData对象
    const FormData = require('form-data');
    const fs = require('fs');
    const path = require('path');
    const form = new FormData();
    
    // 使用默认头像作为测试文件
    try {
      const avatarPath = path.join(__dirname, 'public', 'default-avatar.png');
      const fileStream = fs.createReadStream(avatarPath);
      form.append('avatar', fileStream, 'test-avatar.png');
    } catch (fileError) {
      console.error(`❌ 无法读取默认头像文件: ${fileError.message}`);
      console.log('请确保public/default-avatar.png文件存在');
      return false;
    }
    
    // 发送请求
    const response = await api.put(`/users/${userId}/avatar`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ 上传用户头像成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ 上传用户头像失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取用户头像历史测试
const test_get_avatar_history = async (userId) => {
  console.log('\n===== 测试获取用户头像历史 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  if (!userId) {
    userId = await ask_question('请输入用户ID: ');
  } else {
    console.log(`使用当前用户ID: ${userId}`);
  }
  
  try {
    const response = await api.get(`/users/${userId}/avatar/history`);
    
    console.log('✅ 获取用户头像历史成功!');
    console.log('状态码:', response.status);
    console.log('历史记录数量:', response.data.history.length);
    console.log('历史记录:', response.data.history);
    
    return true;
  } catch (error) {
    console.error('❌ 获取用户头像历史失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 管理员登录测试
const test_admin_login = async () => {
  console.log('\n===== 测试管理员登录 =====');
  
  const username = await ask_question('请输入管理员用户名 (默认: admin): ') || 'admin';
  const password = await ask_question('请输入管理员密码 (默认: admin123): ') || 'admin123';
  
  try {
    const response = await api.post('/admin/login', {
      username,
      password
    });
    
    console.log('✅ 管理员登录成功!');
    console.log('状态码:', response.status);
    console.log('管理员信息:', response.data.admin);
    
    // 保存token用于后续测试
    set_auth_token(response.data.token);
    
    return true;
  } catch (error) {
    console.error('❌ 管理员登录失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取管理员信息测试
const test_get_admin_info = async () => {
  console.log('\n===== 测试获取管理员信息 =====');
  
  if (!authToken) {
    console.log('❌ 未登录管理员账号，请先登录再测试此接口');
    return false;
  }
  
  try {
    const response = await api.get('/admin/me');
    
    console.log('✅ 获取管理员信息成功!');
    console.log('状态码:', response.status);
    console.log('管理员信息:', response.data.admin);
    
    return true;
  } catch (error) {
    console.error('❌ 获取管理员信息失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取用户列表测试（管理员功能）
const test_get_users_list = async () => {
  console.log('\n===== 测试获取用户列表 =====');
  
  if (!authToken) {
    console.log('❌ 未登录管理员账号，请先登录再测试此接口');
    return false;
  }
  
  try {
    const response = await api.get('/admin/users');
    
    console.log('✅ 获取用户列表成功!');
    console.log('状态码:', response.status);
    console.log('用户数量:', response.data.users.length);
    console.log('用户列表示例:', response.data.users.slice(0, 3));
    
    return true;
  } catch (error) {
    console.error('❌ 获取用户列表失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 获取操作日志测试（管理员功能）
const test_get_operation_logs = async () => {
  console.log('\n===== 测试获取操作日志 =====');
  
  if (!authToken) {
    console.log('❌ 未登录管理员账号，请先登录再测试此接口');
    return false;
  }
  
  try {
    const response = await api.get('/admin/logs');
    
    console.log('✅ 获取操作日志成功!');
    console.log('状态码:', response.status);
    console.log('日志数量:', response.data.logs.length);
    console.log('日志示例:', response.data.logs.slice(0, 3));
    
    return true;
  } catch (error) {
    console.error('❌ 获取操作日志失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 检查应用使用权限测试
const test_check_app_permission = async (appId) => {
  console.log('\n===== 测试检查应用使用权限 =====');
  
  if (!authToken) {
    console.log('❌ 未登录，请先登录再测试此接口');
    return false;
  }
  
  if (!appId) {
    appId = await ask_question('请输入应用ID: ');
  } else {
    console.log(`使用获取到的应用ID: ${appId}`);
  }
  
  try {
    const response = await api.get(`/ai-apps/${appId}/check`);
    
    console.log('✅ 检查应用使用权限成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    
    return true;
  } catch (error) {
    console.error('❌ 检查应用使用权限失败!');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
};

// 主测试菜单
const show_menu = async () => {
  console.log('\n=========== API测试工具 ==========');
  console.log('1. 检查API服务状态');
  console.log('2. 用户注册测试');
  console.log('3. 用户登录测试');
  console.log('4. 获取用户信息测试');
  console.log('5. 获取会员卡信息测试');
  console.log('6. 创建充值订单测试');
  console.log('7. 查询订单状态测试');
  console.log('8. 获取交易记录测试');
  console.log('9. 获取AI应用列表测试');
  console.log('10. 使用AI应用测试');
  console.log('11. 检查应用使用权限测试');
  console.log('12. 获取用户头像测试');
  console.log('13. 上传用户头像测试');
  console.log('14. 获取用户头像历史测试');
  console.log('15. 管理员登录测试');
  console.log('16. 获取管理员信息测试');
  console.log('17. 获取用户列表测试');
  console.log('18. 获取操作日志测试');
  console.log('19. 清除登录令牌');
  console.log('0. 退出测试工具');
  console.log('==================================');
  
  if (authToken) {
    console.log('当前状态: 已登录 ✓');
  } else {
    console.log('当前状态: 未登录 ✗');
  }
  
  const choice = await ask_question('\n请选择要测试的功能 (0-19): ');
  
  switch (choice) {
    case '0':
      console.log('感谢使用API测试工具，再见! 👋');
      rl.close();
      break;
    case '1':
      await test_api_status();
      await show_menu();
      break;
    case '2':
      const credentials = await test_register();
      if (credentials) {
        const loginNow = await ask_question('是否立即使用此账号登录? (y/n): ');
        if (loginNow.toLowerCase() === 'y') {
          await test_login(credentials.email, credentials.password);
        }
      }
      await show_menu();
      break;
    case '3':
      await test_login();
      await show_menu();
      break;
    case '4':
      await test_get_user_info();
      await show_menu();
      break;
    case '5':
      await test_get_member_card();
      await show_menu();
      break;
    case '6':
      const txid = await test_create_topup_order();
      if (txid) {
        const checkNow = await ask_question('是否立即查询此订单状态? (y/n): ');
        if (checkNow.toLowerCase() === 'y') {
          await test_check_order_status(txid);
        }
      }
      await show_menu();
      break;
    case '7':
      await test_check_order_status();
      await show_menu();
      break;
    case '8':
      await test_get_transactions();
      await show_menu();
      break;
    case '9':
      const appId = await test_get_ai_apps();
      if (appId) {
        const useNow = await ask_question('是否立即测试使用此应用? (y/n): ');
        if (useNow.toLowerCase() === 'y') {
          await test_use_ai_app(appId);
        }
        const checkPermission = await ask_question('是否检查此应用使用权限? (y/n): ');
        if (checkPermission.toLowerCase() === 'y') {
          await test_check_app_permission(appId);
        }
      }
      await show_menu();
      break;
    case '10':
      await test_use_ai_app();
      await show_menu();
      break;
    case '11':
      await test_check_app_permission();
      await show_menu();
      break;
    case '12':
      await test_get_avatar();
      await show_menu();
      break;
    case '13':
      await test_upload_avatar();
      await show_menu();
      break;
    case '14':
      await test_get_avatar_history();
      await show_menu();
      break;
    case '15':
      await test_admin_login();
      await show_menu();
      break;
    case '16':
      await test_get_admin_info();
      await show_menu();
      break;
    case '17':
      await test_get_users_list();
      await show_menu();
      break;
    case '18':
      await test_get_operation_logs();
      await show_menu();
      break;
    case '19':
      clear_auth_token();
      await show_menu();
      break;
    default:
      console.log('无效选择，请重新输入!');
      await show_menu();
      break;
  }
};

// 启动测试工具
console.log('============================================');
console.log('          会员卡系统 API 测试工具           ');
console.log('============================================');
console.log('此工具用于测试后端API接口功能是否正常');
console.log('确保后端服务已启动并监听 http://localhost:3000');

// 首先检查API服务状态
test_api_status().then(isOnline => {
  if (isOnline) {
    // 如果API在线，显示测试菜单
    show_menu();
  } else {
    // 如果API离线，询问是否继续
    ask_question('\n是否仍要继续测试? (y/n): ').then(answer => {
      if (answer.toLowerCase() === 'y') {
        show_menu();
      } else {
        console.log('测试已取消，请确保API服务正常运行后再试。');
        rl.close();
      }
    });
  }
});