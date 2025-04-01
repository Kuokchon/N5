/**
 * app.js - 后端应用程序入口文件
 * 
 * 该文件是整个后端API服务的主入口点，负责：
 * - 配置Express应用实例
 * - 设置中间件
 * - 注册API路由
 * - 配置错误处理
 * - 启动服务器
 * - 设置定时任务
 * - 处理应用程序的优雅退出
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 创建Express应用实例
const app = express();

/**
 * 中间件配置
 * - cors: 启用跨域资源共享，允许前端应用访问API
 * - express.json: 解析JSON请求体
 */
app.use(cors());
app.use(express.json());

/**
 * 静态文件服务
 * - 提供对public目录下静态资源的访问
 * - 包括默认头像和用户上传的头像
 */
app.use(express.static(path.join(__dirname, 'public')));

/**
 * 数据库和缓存连接
 * - db: MySQL数据库连接池
 * - redisClient: Redis缓存客户端，用于提高性能
 */
const db = require('./config/mysql');
const redisClient = require('./config/redis');

/**
 * 路由配置
 * 导入并注册各个功能模块的路由处理器
 * - authRoutes: 用户认证相关路由（登录、注册等）
 * - memberCardRoutes: 会员卡相关路由（查询、充值等）
 * - transactionRoutes: 交易记录相关路由（查询、创建等）
 * - aiAppRoutes: AI应用相关路由（列表、详情、使用等）
 */
const authRoutes = require('./routes/authRoutes');
const memberCardRoutes = require('./routes/memberCardRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const aiAppRoutes = require('./routes/aiAppRoutes');
const userAvatarRoutes = require('./routes/userAvatarRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 注册API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userAvatarRoutes);
app.use('/api/member-card', memberCardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/ai-apps', aiAppRoutes);
app.use('/api/admin', adminRoutes);

/**
 * 根路由
 * 提供一个简单的健康检查端点，用于验证API服务是否正常运行
 */
app.get('/', (req, res) => {
  res.json({ message: '会员卡系统API服务正在运行' });
});

/**
 * 全局错误处理中间件
 * 捕获所有未处理的异常，防止应用崩溃
 * 向客户端返回统一的错误响应格式
 */
app.use((err, req, res, next) => {
  console.error('全局錯誤處理捕獲到錯誤:');
  console.error('請求路徑:', req.path);
  console.error('請求方法:', req.method);
  console.error('請求參數:', req.params);
  console.error('請求體:', req.body);
  console.error('錯誤信息:', err.message);
  console.error('錯誤堆疊:', err.stack);
  
  res.status(500).json({
    error: '伺服器內部錯誤',
    message: err.message
  });
});

/**
 * 定时任务配置
 * 使用node-cron库设置定期执行的后台任务
 */
const cron = require('node-cron');
const transaction_model = require('./models/transaction_model');
const user_avatar_model = require('./models/user_avatar_model');

/**
 * 过期订单检查任务
 * 每小时（0分时）执行一次，检查并处理过期的支付订单
 * 将状态为'pending'且超过支付时间限制的订单标记为'failed'
 */
cron.schedule('0 * * * *', async () => {
  try {
    const count = await transaction_model.check_expired_orders();
    console.log(`处理了 ${count} 个过期订单`);
  } catch (error) {
    console.error('处理过期订单失败:', error);
  }
});

/**
 * 启动前初始化工作
 * - 创建头像存储目录
 */
(async () => {
  try {
    await user_avatar_model.init();
    console.log('头像存储目录初始化完成');
  } catch (error) {
    console.error('初始化头像存储目录失败:', error);
  }
})();

/**
 * 启动服务器
 * 监听指定端口，默认为3000
 * 端口可通过环境变量PORT配置
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

/**
 * 优雅退出处理
 * 监听SIGINT信号（如按Ctrl+C），确保在应用关闭前：
 * 1. 关闭所有数据库连接
 * 2. 关闭Redis连接
 * 3. 完成所有未完成的请求
 * 防止资源泄漏和数据丢失
 */
process.on('SIGINT', async () => {
  try {
    console.log('关闭数据库连接...');
    await db.end();
    
    console.log('关闭Redis连接...');
    await redisClient.quit();
    
    console.log('服务器已正常关闭');
    process.exit(0);
  } catch (error) {
    console.error('关闭服务器出错:', error);
    process.exit(1);
  }
});