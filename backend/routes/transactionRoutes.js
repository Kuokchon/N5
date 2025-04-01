const express = require('express');
const router = express.Router();
const transaction_model = require('../models/transaction_model');
const pool = require('../config/mysql');

// 身份验证中间件
const auth_middleware = require('../middleware/auth_middleware');

/**
 * 获取用户交易记录列表
 * GET /transactions
 */
router.get('/', auth_middleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const result = await transaction_model.get_user_transactions(user_id, limit, offset);
    
    res.status(200).json({
      transactions: result.transactions,
      pagination: {
        total: result.total,
        page: page,
        limit: limit,
        total_pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('获取交易记录异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 检查订单状态 (适用于前端轮询)
 * GET /transactions/order/:third_party_txid
 */
router.get('/order/:third_party_txid', auth_middleware, async (req, res) => {
  try {
    const { third_party_txid } = req.params;
    const user_id = req.user.user_id;
    
    // 查询订单
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE third_party_txid = ? AND user_id = ?',
      [third_party_txid, user_id]
    );
    
    if (!rows.length) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    const transaction = rows[0];
    
    // 如果订单状态是pending，检查是否过期
    if (transaction.status === 'pending') {
      const created_at = new Date(transaction.created_at);
      const now = new Date();
      const diffMinutes = Math.floor((now - created_at) / (1000 * 60));
      
      // 超过30分钟的订单视为过期
      if (diffMinutes > 30) {
        // 更新订单状态为失败
        await pool.query(
          'UPDATE transactions SET status = "failed" WHERE id = ?',
          [transaction.id]
        );
        
        transaction.status = 'failed';
      }
    }
    
    res.status(200).json({
      order: {
        id: transaction.id,
        third_party_txid: transaction.third_party_txid,
        amount: transaction.amount,
        status: transaction.status,
        created_at: transaction.created_at
      }
    });
  } catch (error) {
    console.error('检查订单状态异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 获取单条交易记录详情
 * GET /transactions/:id
 */
router.get('/:id', auth_middleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.user_id;
    
    const transaction = await transaction_model.get_transaction(id);
    
    if (!transaction) {
      return res.status(404).json({ message: '交易记录不存在' });
    }
    
    // 确保用户只能查看自己的交易记录
    if (transaction.user_id !== user_id) {
      return res.status(403).json({ message: '无权查看此交易记录' });
    }
    
    res.status(200).json({ transaction });
  } catch (error) {
    console.error('获取交易详情异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

module.exports = router;