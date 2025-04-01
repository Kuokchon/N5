/**
 * db.js - 数据库连接配置模块
 * 
 * 该模块负责创建和管理MySQL数据库连接池
 * 使用mysql2/promise库提供异步/await支持的数据库操作
 * 从环境变量中读取数据库连接参数，如果不存在则使用默认值
 */
const mysql = require('mysql2/promise');

/**
 * 创建MySQL连接池
 * 
 * 连接池配置参数：
 * - host: 数据库服务器地址，从环境变量MYSQL_HOST读取
 * - user: 数据库用户名，从环境变量MYSQL_USER读取
 * - password: 数据库密码，从环境变量MYSQL_PASSWORD读取
 * - database: 数据库名称，从环境变量MYSQL_DATABASE读取
 * - waitForConnections: 当没有可用连接时，是否等待连接释放（true）
 * - connectionLimit: 最大连接数，默认为10
 * - queueLimit: 连接池队列限制，0表示不限制
 */
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'qwer8877',
  database: process.env.MYSQL_DATABASE || 'member_card_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 输出连接信息（仅在开发环境）
console.log('MySQL 连接配置:', {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD ? '******' : 'qwer8877',
  database: process.env.MYSQL_DATABASE || 'member_card_system'
});

// 导出连接池实例，供其他模块使用
module.exports = pool;