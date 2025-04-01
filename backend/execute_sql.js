const fs = require('fs');
const mysql = require('mysql2/promise');

async function executeSql(filename) {
  // 讀取SQL文件
  console.log(`Reading SQL file: ${filename}`);
  const sql = fs.readFileSync(filename, 'utf8');
  
  // 從環境變量獲取配置或使用默認值
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'qwer8877',  // 使用.env中的密碼
    database: process.env.DB_NAME || 'member_card_system',  // 使用.env中的數據庫名稱
    multipleStatements: true
  };
  
  console.log('Database config:', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    password: dbConfig.password ? '******' : '(empty)'
  });
  
  // 創建數據庫連接
  console.log('Creating database connection...');
  const connection = await mysql.createConnection(dbConfig);
  console.log('Connection established successfully.');
  
  try {
    // 將SQL分割為單獨的語句執行
    console.log('Executing SQL script...');
    const result = await connection.query(sql);
    console.log('SQL script executed successfully:', result);
  } catch (error) {
    console.error('Error executing SQL script:', error.message);
    
    // 嘗試逐條語句執行
    console.log('Trying to execute statements one by one...');
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt.length === 0) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}`);
        await connection.query(stmt);
        console.log(`Statement ${i + 1} executed successfully.`);
      } catch (stmtError) {
        console.error(`Error executing statement ${i + 1}:`, stmtError.message);
        console.error('Statement:', stmt);
      }
    }
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

// 檢查命令行參數
const filename = process.argv[2] || './user_admin_relation.sql';
executeSql(filename).catch(console.error); 