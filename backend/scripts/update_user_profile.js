/**
 * 更新用户资料数据库脚本
 * 
 * 该脚本用于执行SQL文件，添加用户简介、手机号和微信字段到用户表
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'n5_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// SQL文件路径
const sqlFilePath = path.join(__dirname, '../sql/user_profile.sql');

async function executeSQL() {
  console.log('开始执行用户资料数据库更新...');
  
  let connection;
  try {
    // 读取SQL文件
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('SQL文件读取成功');
    
    // 分割SQL语句
    const sqlStatements = sqlContent
      .split(';')
      .filter(statement => statement.trim() !== '');
    
    // 创建数据库连接
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 执行每条SQL语句
    for (const statement of sqlStatements) {
      try {
        await connection.query(statement + ';');
        console.log('执行SQL语句成功:', statement.substring(0, 50) + '...');
      } catch (err) {
        // 如果是字段已存在的错误，可以忽略
        if (err.code === 'ER_DUP_FIELDNAME') {
          console.log('字段已存在，跳过:', err.message);
        } else {
          throw err;
        }
      }
    }
    
    console.log('用户资料数据库更新完成！');
  } catch (err) {
    console.error('执行SQL出错:', err);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行脚本
executeSQL();