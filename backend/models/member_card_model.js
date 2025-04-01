const pool = require('../config/mysql');
const redis_client = require('../config/redis');
const mysql = require('../config/mysql');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { promisify } = require('util');
const daily_free_quota_model = require('./daily_free_quota_model');

/**
 * 会员卡模型
 * 
 * 本模块实现会员卡的核心业务逻辑，包括:
 * 1. 会员卡信息查询
 * 2. 余额充值流程
 * 3. 消费扣费处理
 * 4. 事务管理与并发控制
 * 5. 过期检查与安全验证
 * 6. 每日免费额度管理与优先扣费
 */

// Redis键前缀，用于锁定会员卡操作，防止并发问题
const CARD_LOCK_PREFIX = 'card_lock:';
// 锁定时间（毫秒），防止死锁
const LOCK_TIMEOUT = 10000;

/**
 * 会员卡模型 - 处理会员卡相关的数据库操作
 */
const member_card_model = {
  // 获取用户会员卡信息
  /**
   * 获取用户会员卡信息
   * 
   * 该方法首先尝试从Redis缓存获取会员卡信息，如果缓存未命中则从数据库获取
   * 如果用户没有会员卡，会自动创建一个新的会员卡并返回
   * 
   * @param {number} user_id - 用户ID
   * @returns {Object|null} 会员卡信息对象，如果创建失败则返回null
   */
  async get_member_card(user_id) {
    // 尝试从缓存获取
    const cache_key = `member_card_${user_id}`;
    const cached_data = await redis_client.get(cache_key);
    
    if (cached_data) {
      return JSON.parse(cached_data);
    }
    
    // 缓存未命中，从数据库获取
    const [rows] = await pool.query(
      'SELECT * FROM member_cards WHERE user_id = ?',
      [user_id]
    );
    
    if (rows.length > 0) {
      // 缓存结果，设置5分钟过期
      await redis_client.setex(cache_key, 300, JSON.stringify(rows[0]));
      return rows[0];
    }
    
    // 如果会员卡不存在，则自动创建
    try {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        
        // 检查用户是否存在
        const [userRows] = await connection.query(
          'SELECT id FROM users WHERE id = ?',
          [user_id]
        );
        
        if (userRows.length === 0) {
          throw new Error('用户不存在');
        }
        
        // 设置默认过期日期为一年后
        const expiry_date = new Date();
        expiry_date.setFullYear(expiry_date.getFullYear() + 1);
        
        // 创建会员卡
        await connection.query(
          'INSERT INTO member_cards (user_id, balance, status, expired_at) VALUES (?, 0, "active", ?)',
          [user_id, expiry_date]
        );
        
        await connection.commit();
        
        // 获取新创建的会员卡
        const [newCardRows] = await pool.query(
          'SELECT * FROM member_cards WHERE user_id = ?',
          [user_id]
        );
        
        if (newCardRows.length > 0) {
          // 缓存结果，设置5分钟过期
          await redis_client.setex(cache_key, 300, JSON.stringify(newCardRows[0]));
          return newCardRows[0];
        }
        
        return null;
      } catch (error) {
        await connection.rollback();
        console.error('创建会员卡失败:', error);
        return null;
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('获取会员卡连接失败:', error);
      return null;
    }
  },
  
  /**
   * 更新会员卡余额 (原子操作)
   * 
   * 该方法实现了会员卡余额的安全更新，使用数据库事务和行锁确保并发安全
   * 支持充值(topup)和扣费(deduction)两种操作类型
   * 
   * @param {number} user_id - 用户ID
   * @param {number} amount - 操作金额
   * @param {string} type - 操作类型，'topup'表示充值，'deduction'表示扣费
   * @returns {Object} 包含操作结果和新余额或错误信息的对象
   */
  async update_balance(user_id, amount, type) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 加锁查询当前余额 (FOR UPDATE 确保并发安全)
      const [cardRows] = await connection.query(
        'SELECT * FROM member_cards WHERE user_id = ? FOR UPDATE',
        [user_id]
      );
      
      if (!cardRows.length) {
        throw new Error('会员卡不存在');
      }
      
      const card = cardRows[0];
      
      // 检查会员卡状态
      if (card.status !== 'active') {
        throw new Error('会员卡已冻结');
      }
      
      // 检查会员卡是否过期
      if (card.expired_at && new Date(card.expired_at) < new Date()) {
        throw new Error('会员卡已过期');
      }
      
      let new_balance;
      
      if (type === 'topup') {
        // 充值
        new_balance = parseFloat(card.balance) + parseFloat(amount);
      } else if (type === 'deduction') {
        // 扣费
        new_balance = parseFloat(card.balance) - parseFloat(amount);
        
        // 检查余额是否充足
        if (new_balance < 0) {
          throw new Error('余额不足');
        }
      } else {
        throw new Error('无效的操作类型');
      }
      
      // 更新会员卡余额
      await connection.query(
        'UPDATE member_cards SET balance = ? WHERE user_id = ?',
        [new_balance, user_id]
      );
      
      // 创建交易记录
      await connection.query(
        'INSERT INTO transactions (user_id, type, amount, status) VALUES (?, ?, ?, "completed")',
        [user_id, type, amount]
      );
      
      await connection.commit();
      
      // 清除缓存
      await redis_client.del(`member_card_${user_id}`);
      
      return {
        success: true,
        new_balance: new_balance
      };
    } catch (error) {
      await connection.rollback();
      return {
        success: false,
        error: error.message
      };
    } finally {
      connection.release();
    }
  },
  
  /**
   * 扣除AI应用费用（整合每日免费额度优先扣费逻辑）
   * 
   * 该方法处理用户使用AI应用时的扣费逻辑，优先使用每日免费额度，不足时再扣除会员卡余额
   * 使用数据库事务确保扣费过程的原子性和一致性
   * 
   * @param {number} user_id - 用户ID
   * @param {number} app_id - AI应用ID
   * @returns {Object} 包含扣费结果、交易ID和金额明细的对象
   */
  async deduct_for_ai_app(user_id, app_id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 查询应用价格
      const [appRows] = await connection.query(
        'SELECT * FROM ai_app_pricing WHERE app_id = ?',
        [app_id]
      );
      
      if (!appRows.length) {
        throw new Error('应用不存在');
      }
      
      const app = appRows[0];
      const price = parseFloat(app.price);
      
      // 锁定查询会员卡
      const [cardRows] = await connection.query(
        'SELECT * FROM member_cards WHERE user_id = ? FOR UPDATE',
        [user_id]
      );
      
      if (!cardRows.length) {
        throw new Error('会员卡不存在');
      }
      
      const card = cardRows[0];
      
      // 检查会员卡状态
      if (card.status !== 'active') {
        throw new Error('会员卡已冻结');
      }
      
      // 检查会员卡是否过期
      if (card.expired_at && new Date(card.expired_at) < new Date()) {
        throw new Error('会员卡已过期');
      }
      
      // 新增: 使用每日免费额度模型计算免费额度使用情况
      const quota_result = await daily_free_quota_model.use_free_quota(user_id, price, connection);
      
      const free_used = quota_result.free_used;
      const balance_used = quota_result.balance_used;
      
      // 创建交易记录
      let transaction_ids = [];
      
      // 如果有免费额度被使用，记录免费额度扣费交易
      if (free_used > 0) {
        const [freeResult] = await connection.query(
          'INSERT INTO transactions (user_id, type, amount, related_app_id, status) VALUES (?, "free_deduction", ?, ?, "completed")',
          [user_id, free_used, app.id]
        );
        transaction_ids.push(freeResult.insertId);
      }
      
      // 如果需要从余额扣费，检查余额并记录余额扣费交易
      if (balance_used > 0) {
        // 检查余额是否充足
        const current_balance = parseFloat(card.balance);
        if (current_balance < balance_used) {
          throw new Error('余额不足');
        }
        
        // 更新余额
        const new_balance = current_balance - balance_used;
        await connection.query(
          'UPDATE member_cards SET balance = ? WHERE user_id = ?',
          [new_balance, user_id]
        );
        
        // 创建余额扣费交易记录
        const [balanceResult] = await connection.query(
          'INSERT INTO transactions (user_id, type, amount, related_app_id, status) VALUES (?, "deduction", ?, ?, "completed")',
          [user_id, balance_used, app.id]
        );
        transaction_ids.push(balanceResult.insertId);
      }
      
      await connection.commit();
      
      // 清除缓存
      await redis_client.del(`member_card_${user_id}`);
      
      return {
        success: true,
        transaction_ids: transaction_ids,
        app_name: app.name,
        free_amount: free_used,
        balance_amount: balance_used,
        total_amount: price
      };
    } catch (error) {
      await connection.rollback();
      return {
        success: false,
        error: error.message
      };
    } finally {
      connection.release();
    }
  },
  
  /**
   * 延长会员卡有效期
   * 
   * 该方法用于延长用户会员卡的有效期，如果会员卡已过期，则从当前日期开始计算
   * 
   * @param {number} user_id - 用户ID
   * @param {number} days - 延长的天数
   * @returns {Object} 包含操作结果和新的过期日期的对象
   */
  async extend_expiry(user_id, days) {
    const connection = await pool.getConnection();
    try {
      // 查询当前有效期
      const [rows] = await connection.query(
        'SELECT expired_at FROM member_cards WHERE user_id = ?',
        [user_id]
      );
      
      if (!rows.length) {
        throw new Error('会员卡不存在');
      }
      
      let expiry_date = new Date(rows[0].expired_at);
      
      // 如果已过期，从当前日期开始计算
      if (expiry_date < new Date()) {
        expiry_date = new Date();
      }
      
      // 增加天数
      expiry_date.setDate(expiry_date.getDate() + parseInt(days));
      
      // 更新有效期
      await connection.query(
        'UPDATE member_cards SET expired_at = ? WHERE user_id = ?',
        [expiry_date, user_id]
      );
      
      // 清除缓存
      await redis_client.del(`member_card_${user_id}`);
      
      return {
        success: true,
        new_expiry_date: expiry_date
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    } finally {
      connection.release();
    }
  },
  
  /**
   * 获取Redis分布式锁
   * 
   * 使用Redis实现分布式锁，防止并发操作导致的数据不一致
   * 锁定成功返回true，失败返回false
   * 
   * @param {string} lockKey - 锁的键名
   * @param {number} timeout - 锁的超时时间(毫秒)，默认为LOCK_TIMEOUT常量值
   * @returns {boolean} 是否成功获取锁
   */
  async acquireLock(lockKey, timeout = LOCK_TIMEOUT) {
    const lockValue = Date.now().toString();
    const result = await redis_client.set(lockKey, lockValue, 'PX', timeout, 'NX');
    return result === 'OK';
  },
  
  /**
   * 释放Redis分布式锁
   * 
   * 释放之前通过acquireLock获取的分布式锁
   * 
   * @param {string} lockKey - 要释放的锁的键名
   * @returns {Promise<void>}
   */
  async releaseLock(lockKey) {
    await redis_client.del(lockKey);
  },
  
  /**
   * 验证订单金额一致性
   * 
   * 比较存储的订单金额与支付平台返回的金额是否一致
   * 考虑到浮点数精度问题，允许0.01的误差
   * 
   * @param {Object} storedOrder - 数据库中存储的订单信息
   * @param {Object} paymentData - 支付平台返回的支付数据
   * @returns {boolean} 金额是否一致
   */
  verifyOrderAmount(storedOrder, paymentData) {
    // 验证金额，允许0.01的误差(处理浮点数精度问题)
    return Math.abs(storedOrder.amount - paymentData.amount) < 0.01;
  },
  
  /**
   * 验证支付平台签名
   * 
   * 使用HMAC-SHA256算法验证支付平台返回的数据签名是否有效
   * 防止支付数据被篡改
   * 
   * @param {Object} paymentData - 支付平台返回的数据，包含signature、timestamp、txid和amount字段
   * @returns {boolean} 签名是否有效
   */
  verifySignature(paymentData) {
    // 在实际生产环境中，这里应该使用与支付平台约定的签名算法和密钥
    const secretKey = process.env.PAYMENT_SECRET_KEY || 'payment_secret';
    const { signature, timestamp, txid, amount } = paymentData;
    
    // 构建签名内容
    const payload = `${timestamp}|${amount}|${txid}|${secretKey}`;
    // 生成签名
    const expectedSignature = crypto.createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');
    
    // 比较签名是否一致
    return expectedSignature === signature;
  },
  
  /**
   * 检查会员卡状态有效性
   * 
   * 验证会员卡是否有效，主要检查是否过期
   * 
   * @param {Object} card - 会员卡信息对象
   * @returns {boolean} 会员卡是否有效
   */
  isCardValid(card) {
    if (!card) return false;
    
    // 检查会员卡是否过期
    const now = new Date();
    const expiredAt = new Date(card.expired_at);
    
    return expiredAt > now;
  },
  
  /**
   * 检查并处理过期未完成的订单
   * 
   * 查找24小时前仍处于pending状态的充值订单，将其标记为失败
   * 通常由定时任务调用，清理长时间未完成的订单
   * 
   * @returns {Object} 包含处理结果和处理的订单数量
   * @throws {Error} 处理过程中出现错误时抛出
   */
  async checkExpiredOrders() {
    const connection = await mysql.getConnection();
    try {
      await connection.beginTransaction();
      
      // 查找24小时前仍处于pending状态的充值订单
      const [orders] = await connection.query(
        `SELECT transaction_id, third_party_txid FROM transactions 
         WHERE type = 'topup' AND status = 'pending' 
         AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
      );
      
      if (orders.length === 0) {
        await connection.commit();
        return { success: true, message: '没有过期订单需要处理' };
      }
      
      // 将这些订单状态更新为失败
      const orderIds = orders.map(order => order.transaction_id);
      await connection.query(
        `UPDATE transactions SET status = 'failed', 
         updated_at = NOW() WHERE transaction_id IN (?)`,
        [orderIds]
      );
      
      await connection.commit();
      return { 
        success: true, 
        message: `成功处理${orders.length}个过期订单`, 
        processed_orders: orders.length 
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  /**
   * 更新会员卡每日免费额度
   * 
   * 设置用户会员卡的每日免费使用额度
   * 使用数据库事务和行锁确保更新的原子性
   * 
   * @param {number} user_id - 用户ID
   * @param {number} daily_free_limit - 新的每日免费额度值
   * @returns {Object} 包含操作结果和新的每日免费额度
   */
  async update_daily_free_limit(user_id, daily_free_limit) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // 锁定会员卡记录
      const [cardRows] = await connection.query(
        'SELECT * FROM member_cards WHERE user_id = ? FOR UPDATE',
        [user_id]
      );
      
      if (!cardRows.length) {
        throw new Error('会员卡不存在');
      }
      
      // 更新会员卡每日免费额度
      await connection.query(
        'UPDATE member_cards SET daily_free_limit = ? WHERE user_id = ?',
        [daily_free_limit, user_id]
      );
      
      // 同时更新当日的免费额度记录（如果存在）
      const today = daily_free_quota_model.get_today_date();
      await connection.query(
        `INSERT INTO daily_free_quota 
          (user_id, date, free_balance, used) 
         VALUES (?, ?, ?, 0)
         ON DUPLICATE KEY UPDATE 
          free_balance = ?`,
        [user_id, today, daily_free_limit, daily_free_limit]
      );
      
      await connection.commit();
      
      // 清除缓存
      await redis_client.del(`member_card_${user_id}`);
      await redis_client.del(`daily_free_quota_${user_id}_${today}`);
      
      return {
        success: true,
        daily_free_limit: daily_free_limit
      };
    } catch (error) {
      await connection.rollback();
      return {
        success: false,
        error: error.message
      };
    } finally {
      connection.release();
    }
  },
  
  /**
   * 获取用户当日免费额度使用情况
   * 
   * 查询用户当天的免费额度总量、已使用量和剩余量
   * 结合会员卡信息和每日免费额度记录提供完整的额度使用状况
   * 
   * @param {number} user_id - 用户ID
   * @returns {Object} 包含免费额度信息的对象，包括总额度、已用额度和剩余额度
   */
  async get_daily_free_quota_info(user_id) {
    try {
      // 获取会员卡信息
      const card = await this.get_member_card(user_id);
      if (!card) {
        throw new Error('会员卡不存在');
      }
      
      // 获取当日免费额度
      const quota = await daily_free_quota_model.get_daily_quota(user_id);
      
      return {
        success: true,
        daily_free_limit: parseFloat(card.daily_free_limit),
        free_balance: quota ? parseFloat(quota.free_balance) : 0,
        used: quota ? parseFloat(quota.used) : 0,
        date: quota ? quota.date : daily_free_quota_model.get_today_date()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = member_card_model;