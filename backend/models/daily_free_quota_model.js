/**
 * daily_free_quota_model.js - 每日免费额度模型
 * 
 * 本模块负责处理系统中每日免费额度相关操作，包括：
 * 1. 初始化和重置用户每日免费额度
 * 2. 检查和使用免费额度
 * 3. 与扣费流程集成
 * 4. 提供免费额度查询
 * 
 * 每日免费额度是会员系统的重要功能，允许用户每天免费使用一定额度的AI应用
 * 系统会在每天凌晨自动重置所有用户的免费额度
 */

const pool = require('../config/mysql');
const redis_client = require('../config/redis');

const daily_free_quota_model = {
  /**
   * 获取用户当日免费额度
   * 
   * 该方法首先尝试从Redis缓存获取用户当日的免费额度信息
   * 如果缓存未命中，则从数据库查询；如果数据库中不存在，则初始化新的免费额度
   * 
   * @param {number} user_id - 用户ID
   * @returns {Promise<Object>} 返回免费额度信息对象，包含free_balance(剩余额度)和used(已使用额度)等字段
   * @throws {Error} 如果用户不存在或会员卡不存在时抛出错误
   */
  async get_daily_quota(user_id) {
    // 尝试从缓存获取
    const cache_key = `daily_free_quota_${user_id}_${this.get_today_date()}`;
    const cached_data = await redis_client.get(cache_key);
    
    if (cached_data) {
      return JSON.parse(cached_data);
    }
    
    // 缓存未命中，从数据库获取
    const [rows] = await pool.query(
      'SELECT * FROM daily_free_quota WHERE user_id = ? AND date = ?',
      [user_id, this.get_today_date()]
    );
    
    if (rows.length > 0) {
      // 缓存结果，设置1小时过期
      await redis_client.setex(cache_key, 3600, JSON.stringify(rows[0]));
      return rows[0];
    }
    
    // 如果今日额度不存在，初始化额度
    const quota = await this.init_daily_quota(user_id);
    return quota;
  },
  
  /**
   * 初始化用户每日免费额度
   * 
   * 基于会员卡设置的daily_free_limit初始化用户当日的免费额度
   * 如果当日额度记录已存在，则重置为初始状态
   * 使用INSERT...ON DUPLICATE KEY UPDATE确保并发安全
   * 
   * @param {number} user_id - 用户ID
   * @param {Object} connection - 可选的数据库连接（用于事务），如果不提供则使用默认连接池
   * @returns {Promise<Object>} 返回初始化的免费额度对象，包含id、user_id、date、free_balance和used字段
   * @throws {Error} 如果会员卡不存在则抛出错误
   */
  async init_daily_quota(user_id, connection = null) {
    const conn = connection || pool;
    
    // 获取会员卡设置的每日免费额度上限
    const [cardRows] = await conn.query(
      'SELECT daily_free_limit FROM member_cards WHERE user_id = ?',
      [user_id]
    );
    
    if (!cardRows.length) {
      throw new Error('会员卡不存在');
    }
    
    const daily_free_limit = parseFloat(cardRows[0].daily_free_limit);
    const today = this.get_today_date();
    
    // 使用INSERT...ON DUPLICATE KEY UPDATE确保并发安全
    const [result] = await conn.query(
      `INSERT INTO daily_free_quota 
        (user_id, date, free_balance, used) 
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE 
        free_balance = VALUES(free_balance), 
        used = 0`,
      [user_id, today, daily_free_limit]
    );
    
    // 清除缓存
    const cache_key = `daily_free_quota_${user_id}_${today}`;
    await redis_client.del(cache_key);
    
    // 获取新创建/更新的记录
    const [newRows] = await conn.query(
      'SELECT * FROM daily_free_quota WHERE user_id = ? AND date = ?',
      [user_id, today]
    );
    
    if (newRows.length > 0) {
      // 缓存结果，设置1小时过期
      await redis_client.setex(cache_key, 3600, JSON.stringify(newRows[0]));
      return newRows[0];
    }
    
    return null;
  },
  
  /**
   * 重置所有用户的每日免费额度
   * 
   * 由定时任务调用，每天凌晨执行
   * 为所有状态为"active"的会员卡用户重置每日免费额度
   * 同时更新会员卡上次更新免费额度的日期
   * 
   * @returns {Promise<number>} 返回重置的用户数量
   * @throws {Error} 数据库操作失败时抛出错误
   */
  async reset_all_daily_quota() {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 获取所有有效会员卡
      const [cardRows] = await connection.query(
        'SELECT user_id, daily_free_limit FROM member_cards WHERE status = "active"'
      );
      
      const today = this.get_today_date();
      
      // 批量重置/创建每日额度
      for (const card of cardRows) {
        await connection.query(
          `INSERT INTO daily_free_quota 
            (user_id, date, free_balance, used) 
           VALUES (?, ?, ?, 0)
           ON DUPLICATE KEY UPDATE 
            free_balance = VALUES(free_balance), 
            used = 0`,
          [card.user_id, today, card.daily_free_limit]
        );
        
        // 更新会员卡上次更新免费额度的日期
        await connection.query(
          'UPDATE member_cards SET last_free_quota_update = ? WHERE user_id = ?',
          [today, card.user_id]
        );
        
        // 清除缓存
        await redis_client.del(`daily_free_quota_${card.user_id}_${today}`);
      }
      
      await connection.commit();
      return cardRows.length;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  /**
   * 检查并使用免费额度
   * 
   * 计算用户可用的免费额度，优先使用免费额度，并返回需要从余额扣除的差额
   * 该方法必须在数据库事务中调用，以确保并发安全
   * 使用行锁(FOR UPDATE)防止并发问题
   * 
   * @param {number} user_id - 用户ID
   * @param {number} amount - 需要支付的总金额
   * @param {Object} connection - 数据库连接（用于事务），必须提供
   * @returns {Promise<Object>} 返回包含free_used(使用的免费额度)和balance_used(需要从余额扣除的金额)的对象
   * @throws {Error} 如果未提供数据库连接或操作失败则抛出错误
   */
  async use_free_quota(user_id, amount, connection) {
    if (!connection) {
      throw new Error('必须提供数据库连接用于事务');
    }
    
    // 获取锁定的当日额度记录
    const [rows] = await connection.query(
      'SELECT * FROM daily_free_quota WHERE user_id = ? AND date = ? FOR UPDATE',
      [user_id, this.get_today_date()]
    );
    
    let quota = null;
    
    if (rows.length === 0) {
      // 如果不存在，初始化额度
      quota = await this.init_daily_quota(user_id, connection);
    } else {
      quota = rows[0];
    }
    
    if (!quota) {
      // 无可用免费额度，全部从余额扣除
      return {
        free_used: 0,
        balance_used: parseFloat(amount)
      };
    }
    
    // 计算可用的免费额度
    const free_balance = parseFloat(quota.free_balance);
    const free_used = Math.min(free_balance, parseFloat(amount));
    
    if (free_used > 0) {
      // 更新免费额度
      await connection.query(
        'UPDATE daily_free_quota SET free_balance = free_balance - ?, used = used + ? WHERE id = ?',
        [free_used, free_used, quota.id]
      );
      
      // 清除缓存
      await redis_client.del(`daily_free_quota_${user_id}_${this.get_today_date()}`);
    }
    
    // 计算需要从余额扣除的金额
    const balance_used = parseFloat(amount) - free_used;
    
    return {
      free_used: free_used,
      balance_used: balance_used
    };
  },
  
  /**
   * 获取当前日期（YYYY-MM-DD格式）
   * 
   * 用于统一系统中日期的格式和时区处理
   * 返回的日期格式为YYYY-MM-DD，如2023-05-15
   * 
   * @returns {string} 返回当前日期字符串，格式为YYYY-MM-DD
   */
  get_today_date() {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }
};

module.exports = daily_free_quota_model;