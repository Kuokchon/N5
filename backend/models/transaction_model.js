/**
 * 交易模型
 * 
 * 本模块负责处理系统中所有交易相关操作，包括：
 * 1. 创建和管理充值订单
 * 2. 处理支付状态更新和余额变更
 * 3. 记录会员卡消费记录
 * 4. 提供交易历史查询
 * 5. 处理过期订单的清理
 * 
 * 所有涉及金额变更的操作都使用数据库事务进行保护，
 * 确保在高并发环境下数据的一致性和完整性
 */

const pool = require('../config/mysql');

const transaction_model = {
  /**
   * 创建充值支付订单
   * 将新订单信息写入交易表，初始状态为pending
   * 
   * @param {number} user_id - 用户ID
   * @param {number} amount - 充值金额
   * @param {string} third_party_txid - 第三方支付平台生成的交易ID
   * @returns {Promise<number>} - 返回新创建的订单ID
   * @throws {Error} - 数据库操作异常时抛出错误
   */
  async create_payment_order(user_id, amount, third_party_txid) {
    const [result] = await pool.query(
      'INSERT INTO transactions (user_id, type, amount, third_party_txid, status) VALUES (?, "topup", ?, ?, "pending")',
      [user_id, amount, third_party_txid]
    );
    
    return result.insertId;
  },
  
  /**
   * 更新支付订单状态
   * 处理支付平台回调，更新订单状态并更新会员卡余额
   * 使用事务和行锁(FOR UPDATE)确保并发安全
   * 
   * @param {string} third_party_txid - 第三方支付平台交易ID
   * @param {string} status - 新的订单状态('completed'/'failed')
   * @returns {Promise<boolean>} - 操作是否成功
   * @throws {Error} - 处理异常时抛出错误
   */
  async update_payment_status(third_party_txid, status) {
    const connection = await pool.getConnection();
    try {
      // 开启事务，确保数据一致性
      await connection.beginTransaction();
      
      // 使用FOR UPDATE获取排他锁，防止并发更新同一订单
      const [rows] = await connection.query(
        'SELECT * FROM transactions WHERE third_party_txid = ? AND status = "pending" FOR UPDATE',
        [third_party_txid]
      );
      
      if (!rows.length) {
        throw new Error('订单不存在或已处理');
      }
      
      const transaction = rows[0];
      
      // 更新订单状态
      await connection.query(
        'UPDATE transactions SET status = ? WHERE id = ?',
        [status, transaction.id]
      );
      
      // 如果支付成功，更新会员卡余额
      if (status === 'completed') {
        // 使用FOR UPDATE锁定会员卡记录，防止并发更新余额
        const [cardRows] = await connection.query(
          'SELECT balance FROM member_cards WHERE user_id = ? FOR UPDATE',
          [transaction.user_id]
        );
        
        if (!cardRows.length) {
          throw new Error('会员卡不存在');
        }
        
        // 确保使用parseFloat处理金额，避免精度问题
        const current_balance = parseFloat(cardRows[0].balance);
        const new_balance = current_balance + parseFloat(transaction.amount);
        
        // 更新余额
        await connection.query(
          'UPDATE member_cards SET balance = ? WHERE user_id = ?',
          [new_balance, transaction.user_id]
        );
      }
      
      // 提交事务
      await connection.commit();
      return true;
    } catch (error) {
      // 发生错误时回滚事务，确保数据一致性
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  },
  
  /**
   * 创建消费交易记录
   * 记录用户使用AI应用时的扣费情况
   * 
   * @param {number} user_id - 用户ID
   * @param {string} app_id - 应用ID
   * @param {number} amount - 扣费金额
   * @param {Object} connection - 数据库连接(用于事务)
   * @returns {Promise<number>} - 返回新创建的交易记录ID
   * @throws {Error} - 数据库操作异常时抛出错误
   */
  async create_deduction_record(user_id, app_id, amount, connection) {
    // 使用传入的连接对象，支持外部事务
    const [result] = await connection.query(
      'INSERT INTO transactions (user_id, type, amount, related_app_id, status) VALUES (?, "deduction", ?, ?, "completed")',
      [user_id, amount, app_id]
    );
    
    return result.insertId;
  },
  
  /**
   * 获取用户交易记录
   * 查询用户的充值和消费历史，支持分页
   * 
   * @param {number} user_id - 用户ID
   * @param {number} limit - 每页记录数
   * @param {number} offset - 分页偏移量
   * @returns {Promise<Object>} - 包含交易记录和总数的对象
   * @throws {Error} - 数据库操作异常时抛出错误
   */
  async get_user_transactions(user_id, limit = 10, offset = 0) {
    // 查询交易记录，关联AI应用信息
    const [rows] = await pool.query(
      `SELECT t.*, a.name as app_name 
       FROM transactions t
       LEFT JOIN ai_app_pricing a ON t.related_app_id = a.id
       WHERE t.user_id = ?
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      [user_id, limit, offset]
    );
    
    // 查询总记录数用于前端分页
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?',
      [user_id]
    );
    
    return {
      transactions: rows,
      total: countRows[0].total
    };
  },
  
  /**
   * 获取单条交易记录详情
   * 
   * @param {number} id - 交易记录ID
   * @returns {Promise<Object|null>} - 交易记录对象或null
   * @throws {Error} - 数据库操作异常时抛出错误
   */
  async get_transaction(id) {
    const [rows] = await pool.query(
      `SELECT t.*, a.name as app_name, a.price as app_price 
       FROM transactions t
       LEFT JOIN ai_app_pricing a ON t.related_app_id = a.id
       WHERE t.id = ?`,
      [id]
    );
    
    return rows[0] || null;
  },
  
  /**
   * 根据第三方交易ID查询订单
   * 用于支付回调时验证订单
   * 
   * @param {string} third_party_txid - 第三方支付平台交易ID
   * @returns {Promise<Object|null>} - 订单对象或null
   * @throws {Error} - 数据库操作异常时抛出错误
   */
  async get_order_by_third_party_txid(third_party_txid) {
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE third_party_txid = ?',
      [third_party_txid]
    );
    
    return rows[0] || null;
  },
  
  /**
   * 检查并处理过期的待处理订单
   * 系统定时任务调用，自动清理超时未完成的订单
   * 
   * @returns {Promise<number>} - 处理的订单数量
   * @throws {Error} - 处理异常时抛出错误
   */
  async check_expired_orders() {
    const connection = await pool.getConnection();
    try {
      // 开启事务
      await connection.beginTransaction();
      
      // 使用FOR UPDATE锁定要处理的记录，防止并发处理
      const [rows] = await connection.query(
        `SELECT * FROM transactions 
         WHERE status = 'pending' 
         AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
         FOR UPDATE`
      );
      
      // 将这些订单标记为失败
      if (rows.length > 0) {
        const ids = rows.map(row => row.id);
        await connection.query(
          `UPDATE transactions 
           SET status = 'failed', updated_at = NOW() 
           WHERE id IN (?)`,
          [ids]
        );
      }
      
      // 提交事务
      await connection.commit();
      return rows.length;
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      throw error;
    } finally {
      // 释放连接
      connection.release();
    }
  }
};

module.exports = transaction_model;