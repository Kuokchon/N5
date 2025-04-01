const pool = require('../config/mysql');
const redis_client = require('../config/redis');

/**
 * AI应用模型 - 处理AI应用相关的数据库操作
 */
const ai_app_model = {
  // 获取所有AI应用列表
  async get_all_apps() {
    // 尝试从缓存获取
    const cache_key = 'all_ai_apps';
    const cached_data = await redis_client.get(cache_key);
    
    if (cached_data) {
      return JSON.parse(cached_data);
    }
    
    // 缓存未命中，从数据库获取
    const [rows] = await pool.query(
      'SELECT * FROM ai_app_pricing ORDER BY price ASC'
    );
    
    // 缓存结果，设置10分钟过期
    await redis_client.setex(cache_key, 600, JSON.stringify(rows));
    
    return rows;
  },
  
  // 根据ID获取应用信息
  async get_app_by_id(app_id) {
    // 尝试从缓存获取
    const cache_key = `ai_app_${app_id}`;
    const cached_data = await redis_client.get(cache_key);
    
    if (cached_data) {
      return JSON.parse(cached_data);
    }
    
    // 缓存未命中，从数据库获取
    const [rows] = await pool.query(
      'SELECT * FROM ai_app_pricing WHERE app_id = ?',
      [app_id]
    );
    
    if (rows.length > 0) {
      // 缓存结果，设置10分钟过期
      await redis_client.setex(cache_key, 600, JSON.stringify(rows[0]));
      return rows[0];
    }
    
    return null;
  },
  
  // 创建新的AI应用
  async create_app(app_data) {
    const { app_id, name, price, description } = app_data;
    
    const [result] = await pool.query(
      'INSERT INTO ai_app_pricing (app_id, name, price, description) VALUES (?, ?, ?, ?)',
      [app_id, name, price, description]
    );
    
    // 清除应用缓存
    await redis_client.del('all_ai_apps');
    
    return result.insertId;
  },
  
  // 更新AI应用信息
  async update_app(app_id, app_data) {
    const { name, price, description } = app_data;
    
    const [result] = await pool.query(
      'UPDATE ai_app_pricing SET name = ?, price = ?, description = ? WHERE app_id = ?',
      [name, price, description, app_id]
    );
    
    // 清除应用缓存
    await redis_client.del(`ai_app_${app_id}`);
    await redis_client.del('all_ai_apps');
    
    return result.affectedRows > 0;
  },
  
  // 检查用户是否有足够余额使用应用
  async check_user_can_use_app(user_id, app_id) {
    // 查询应用价格
    const [appRows] = await pool.query(
      'SELECT price FROM ai_app_pricing WHERE app_id = ?',
      [app_id]
    );
    
    if (!appRows.length) {
      return {
        can_use: false,
        error: '应用不存在'
      };
    }
    
    const app_price = parseFloat(appRows[0].price);
    
    // 查询用户会员卡
    const [cardRows] = await pool.query(
      'SELECT balance, status, expired_at FROM member_cards WHERE user_id = ?',
      [user_id]
    );
    
    if (!cardRows.length) {
      return {
        can_use: false,
        error: '会员卡不存在'
      };
    }
    
    const card = cardRows[0];
    
    // 检查会员卡状态
    if (card.status !== 'active') {
      return {
        can_use: false,
        error: '会员卡已冻结'
      };
    }
    
    // 检查会员卡是否过期
    if (card.expired_at && new Date(card.expired_at) < new Date()) {
      return {
        can_use: false,
        error: '会员卡已过期'
      };
    }
    
    // 检查余额是否充足
    if (parseFloat(card.balance) < app_price) {
      return {
        can_use: false,
        error: '余额不足',
        balance: card.balance,
        required: app_price
      };
    }
    
    return {
      can_use: true,
      balance: card.balance,
      price: app_price
    };
  }
};

module.exports = ai_app_model;