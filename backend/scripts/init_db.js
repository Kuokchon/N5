require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function init_database() {
  console.log('开始初始化数据库...');
  
  const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    multipleStatements: true // 允许执行多条SQL语句
  };
  
  // 创建连接
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('数据库连接成功');
    
    // 创建数据库（如果不存在）
    const dbName = process.env.MYSQL_DATABASE;
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`数据库 ${dbName} 已创建或已存在`);
    
    // 使用该数据库
    await connection.query(`USE ${dbName}`);
    
    // 读取并执行SQL文件
    const sqlFilePath = path.join(__dirname, '../sql/schema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // 分割SQL语句并执行
    const statements = sqlContent.split(';').filter(statement => statement.trim() !== '');
    
    for (const statement of statements) {
      try {
        await connection.query(statement);
        // 检查是创建表的语句还是其他语句
        const tableName = statement.match(/CREATE TABLE.*?(\w+)/i);
        if (tableName && tableName[1]) {
          console.log(`表 ${tableName[1]} 已创建或已更新`);
        } else if (statement.includes('ALTER TABLE') && statement.includes('ADD INDEX')) {
          // 索引可能已存在，这种情况下MySQL会报错
          console.log('尝试添加索引');
        }
      } catch (error) {
        // 如果是索引已存在的错误，则忽略它
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`索引已存在，跳过: ${error.sqlMessage}`);
        } else {
          // 其他错误则抛出
          throw error;
        }
      }
    }
    
    // 创建示例AI应用
    await insert_sample_data(connection);
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

async function insert_sample_data(connection) {
  console.log('开始插入示例数据...');
  
  // 修改逻辑：我们使用INSERT ON DUPLICATE KEY UPDATE来确保数据被正确插入
  // 示例AI应用
  const sampleApps = [
    { app_id: 'chatgpt', name: 'ChatGPT对话', price: 5.00, description: '自然语言对话AI，可用于回答问题、创作内容' },
    { app_id: 'image_gen', name: '图像生成', price: 10.00, description: '根据文字描述生成高质量图像' },
    { app_id: 'code_assist', name: '代码助手', price: 8.00, description: '帮助编写和优化代码，解决编程问题' },
    { app_id: 'translation', name: '智能翻译', price: 3.00, description: '多语言翻译服务，支持100+语种' },
    { app_id: 'data_analysis', name: '数据分析', price: 15.00, description: '智能数据分析和可视化' }
  ];
  
  for (const app of sampleApps) {
    // 使用INSERT ... ON DUPLICATE KEY UPDATE确保每次都更新
    await connection.query(
      `INSERT INTO ai_app_pricing (app_id, name, price, description) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       name = VALUES(name), 
       price = VALUES(price), 
       description = VALUES(description)`,
      [app.app_id, app.name, app.price, app.description]
    );
    console.log(`已插入/更新AI应用: ${app.name}`);
  }
  
  console.log('示例数据处理完成');
}

init_database(); 