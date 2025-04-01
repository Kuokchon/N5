/**
 * 數據庫表結構檢查腳本
 * 
 * 本腳本用於檢查以下表是否存在及其結構：
 * - admin_users, operation_logs (來自admin_tables.sql)
 * - daily_free_quota (來自daily_free_quota.sql)
 * - user_avatars_history (來自user_avatar.sql)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function check_tables() {
  console.log('開始檢查數據庫表結構...');
  
  const DB_CONFIG = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
  };
  
  // 要檢查的表名
  const TABLES = [
    'admin_users',
    'operation_logs',
    'daily_free_quota',
    'user_avatars_history',
    'transactions',
    'users',
    'member_cards'
  ];
  
  // 要檢查的字段
  const COLUMNS = {
    'users': ['avatar_url', 'avatar_updated_at'],
    'member_cards': ['daily_free_limit', 'last_free_quota_update'],
    'transactions': ['type']
  };
  
  // 創建連接
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('數據庫連接成功');
    
    // 檢查表是否存在
    console.log('\n--- 檢查表是否存在 ---');
    for (const table of TABLES) {
      try {
        // 使用轉義防止SQL注入
        const query = `SELECT 1 FROM information_schema.tables 
                      WHERE table_schema = ? AND table_name = ?`;
        const [rows] = await connection.query(query, [DB_CONFIG.database, table]);
        
        if (rows.length > 0) {
          console.log(`✅ 表 ${table} 存在`);
          
          try {
            // 獲取表結構
            const [columns] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
            console.log(`   字段數量: ${columns.length}`);
            
            // 如果是transactions表，檢查type字段的枚舉值
            if (table === 'transactions') {
              for (const col of columns) {
                if (col.Field === 'type') {
                  console.log(`   Type欄位的類型: ${col.Type}`);
                  // 檢查是否包含free_deduction枚舉值
                  if (col.Type.includes('free_deduction')) {
                    console.log(`   ✅ Type欄位包含'free_deduction'枚舉值`);
                  } else {
                    console.log(`   ❌ Type欄位不包含'free_deduction'枚舉值`);
                  }
                }
              }
            }
          } catch (err) {
            console.error(`   獲取表結構失敗: ${err.message}`);
          }
        } else {
          console.log(`❌ 表 ${table} 不存在`);
        }
      } catch (error) {
        console.error(`❌ 檢查表 ${table} 時出錯: ${error.message}`);
      }
    }
    
    // 檢查表中是否存在特定字段
    console.log('\n--- 檢查特定字段是否存在 ---');
    for (const [table, columnList] of Object.entries(COLUMNS)) {
      for (const column of columnList) {
        try {
          const query = `SELECT 1 FROM information_schema.columns 
                        WHERE table_schema = ? AND table_name = ? AND column_name = ?`;
          const [rows] = await connection.query(query, [DB_CONFIG.database, table, column]);
          
          if (rows.length > 0) {
            console.log(`✅ 表 ${table} 中的字段 ${column} 存在`);
          } else {
            console.log(`❌ 表 ${table} 中的字段 ${column} 不存在`);
          }
        } catch (error) {
          console.error(`❌ 檢查表 ${table} 的字段 ${column} 時出錯: ${error.message}`);
        }
      }
    }
    
    console.log('\n數據庫檢查完成');
  } catch (error) {
    console.error('數據庫檢查失敗:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('數據庫連接已關閉');
    }
  }
}

check_tables(); 