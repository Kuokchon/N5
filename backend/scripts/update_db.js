/**
 * 數據庫更新腳本 - 執行新的SQL文件
 * 
 * 本腳本用於執行以下SQL文件：
 * - admin_tables.sql
 * - daily_free_quota.sql
 * - user_avatar.sql
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function update_database() {
  console.log('開始更新數據庫...');
  
  const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true // 允許執行多條SQL語句
  };
  
  // 需要執行的SQL文件
  const SQL_FILES = [
    'admin_tables.sql',
    'daily_free_quota.sql',
    'user_avatar.sql'
  ];
  
  // 創建連接
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('數據庫連接成功');
    
    // 逐個執行SQL文件
    for (const sqlFile of SQL_FILES) {
      console.log(`執行SQL文件: ${sqlFile}`);
      const sqlFilePath = path.join(__dirname, '../sql', sqlFile);
      
      // 檢查文件是否存在
      if (!fs.existsSync(sqlFilePath)) {
        console.error(`SQL文件不存在: ${sqlFilePath}`);
        continue;
      }
      
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // 分割SQL語句並執行
      const statements = sqlContent.split(';').filter(statement => statement.trim() !== '');
      
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        try {
          await connection.query(statement);
          
          // 檢查是創建表的語句還是修改表的語句
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            const tableName = statement.match(/CREATE TABLE.*?(\w+)/i);
            if (tableName && tableName[1]) {
              console.log(`表 ${tableName[1]} 已創建`);
            }
          } else if (statement.toUpperCase().includes('ALTER TABLE')) {
            const tableName = statement.match(/ALTER TABLE.*?(\w+)/i);
            if (tableName && tableName[1]) {
              console.log(`表 ${tableName[1]} 已修改`);
            }
          } else if (statement.toUpperCase().includes('CREATE INDEX')) {
            console.log('索引已創建');
          } else if (statement.toUpperCase().includes('INSERT INTO')) {
            console.log('數據已插入');
          }
        } catch (error) {
          // 處理一些常見的錯誤
          if (error.code === 'ER_DUP_KEYNAME') {
            console.log(`索引已存在，跳過: ${error.sqlMessage}`);
          } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`表已存在，跳過: ${error.sqlMessage}`);
          } else if (error.code === 'ER_DUP_ENTRY') {
            console.log(`數據已存在，跳過: ${error.sqlMessage}`);
          } else if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`字段已存在，跳過: ${error.sqlMessage}`);
          } else {
            console.error(`SQL執行錯誤: ${error.message}`);
            console.error(`問題SQL: ${statement}`);
          }
        }
      }
      
      console.log(`SQL文件 ${sqlFile} 執行完成`);
    }
    
    console.log('數據庫更新完成');
  } catch (error) {
    console.error('數據庫更新失敗:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('數據庫連接已關閉');
    }
  }
}

update_database(); 