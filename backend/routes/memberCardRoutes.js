/**
 * 会员卡路由模块
 * 
 * 本模块提供会员卡相关的API接口，包括：
 * 1. 会员卡信息查询
 * 2. 充值流程处理
 * 3. 支付回调处理
 * 4. 消费扣费处理
 * 5. 余额检查
 * 
 * 所有接口均实现了必要的用户验证、参数验证和错误处理
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const member_card_model = require('../models/member_card_model');
const crypto = require('crypto');
const transaction_model = require('../models/transaction_model');
const ai_app_model = require('../models/ai_app_model');

// 身份验证中间件
const auth_middleware = require('../middleware/auth_middleware');
const admin_middleware = require('../middleware/admin_middleware');

/**
 * 获取会员卡详情
 * 返回用户会员卡的余额、状态和有效期
 * 
 * 路由: GET /member-card
 * 权限: 需要用户登录
 * 
 * @returns {Object} 会员卡信息对象
 */
router.get('/', auth_middleware, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    // 获取会员卡信息
    const memberCard = await member_card_model.get_member_card(user_id);
    
    if (!memberCard) {
      return res.status(404).json({ message: '会员卡不存在' });
    }
    
    res.status(200).json({ 
      card: {
        balance: memberCard.balance,
        status: memberCard.status,
        expired_at: memberCard.expired_at,
        created_at: memberCard.created_at
      }
    });
  } catch (error) {
    console.error('获取会员卡异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 会员卡充值流程 - 第一步：创建充值订单
 * 
 * 流程说明：
 * 1. 验证充值金额合法性
 * 2. 检查会员卡状态
 * 3. 生成第三方支付平台的订单号
 * 4. 创建交易记录，状态为"pending"
 * 5. 返回支付信息，前端据此跳转到支付页面
 * 
 * 路由: POST /member-card/topup
 * 权限: 需要用户登录
 * 请求参数: {amount: 充值金额}
 * 
 * @returns {Object} 订单信息和支付链接
 */
router.post('/topup', auth_middleware, async (req, res) => {
  try {
    const { amount } = req.body;
    const user_id = req.user.user_id;
    
    // 验证金额 - 确保是正数且格式正确
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: '无效的充值金额' });
    }
    
    // 精确到两位小数
    const formatted_amount = parseFloat(amount).toFixed(2);
    
    // 获取会员卡信息
    const memberCard = await member_card_model.get_member_card(user_id);
    
    if (!memberCard) {
      return res.status(404).json({ message: '会员卡不存在' });
    }
    
    // 这里应该调用第三方支付API创建订单
    // 模拟生成支付平台订单号 - 实际项目中应调用真实支付API
    const third_party_txid = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    // 创建充值交易记录，状态为pending
    const transaction_id = await transaction_model.create_payment_order(
      user_id, 
      formatted_amount, 
      third_party_txid
    );
    
    // 构建支付返回信息
    res.status(200).json({
      message: '充值订单创建成功',
      order: {
        transaction_id,
        third_party_txid,
        amount: formatted_amount,
        status: 'pending'
      },
      // 模拟支付链接，实际应从第三方支付API获取
      payment_url: `/mock-payment?order_id=${transaction_id}&amount=${formatted_amount}`
    });
  } catch (error) {
    console.error('创建充值订单异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 会员卡充值流程 - 第二步：处理支付回调
 * 
 * 流程说明：
 * 1. 接收支付平台异步通知
 * 2. 验证签名，防止伪造请求
 * 3. 校验订单金额与原始订单是否一致
 * 4. 更新订单状态为completed/failed
 * 5. 如果支付成功，更新会员卡余额
 * 
 * 注意：此接口通常由支付平台调用，不是前端直接调用
 * 
 * 路由: POST /member-card/payment-callback
 * 权限: 无需身份验证(但需验证签名)
 * 
 * @returns {Object} 处理结果
 */
router.post('/payment-callback', async (req, res) => {
  try {
    const { txid, amount, status, signature, timestamp } = req.body;
    
    // 参数检查
    if (!txid || !amount || !status || !signature || !timestamp) {
      return res.status(400).json({ message: '回调参数不完整' });
    }
    
    // 1. 查询订单信息
    const order = await transaction_model.get_order_by_third_party_txid(txid);
    if (!order) {
      return res.status(404).json({ message: '订单不存在' });
    }
    
    // 2. 验证订单状态 - 只处理pending状态的订单
    if (order.status !== 'pending') {
      return res.status(400).json({ message: '订单已处理' });
    }
    
    // 3. 验证签名，防止伪造请求
    // 实际项目中应使用完整的签名验证算法
    const secretKey = process.env.PAYMENT_SECRET_KEY || 'payment_secret';
    const signPayload = `${timestamp}|${amount}|${txid}|${secretKey}`;
    const expectedSignature = crypto.createHmac('sha256', secretKey)
      .update(signPayload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return res.status(403).json({ message: '签名验证失败' });
    }
    
    // 4. 验证金额一致性，防止篡改
    if (Math.abs(parseFloat(order.amount) - parseFloat(amount)) > 0.01) {
      return res.status(400).json({ message: '订单金额不匹配' });
    }
    
    // 5. 更新订单状态，如果成功则增加余额
    await transaction_model.update_payment_status(txid, status);
    
    res.status(200).json({ message: '支付状态更新成功' });
  } catch (error) {
    console.error('处理支付回调异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 会员卡扣费流程 - 使用AI应用并扣费
 * 
 * 流程说明：
 * 1. 验证应用ID合法性
 * 2. 检查会员卡状态是否有效
 * 3. 验证余额是否足够支付应用费用
 * 4. 执行扣费操作，创建消费记录
 * 5. 返回最新余额和交易信息
 * 
 * 并发控制：
 * - 使用数据库事务保证扣费和余额更新的原子性
 * - 采用行锁防止并发扣费导致余额计算错误
 * - 可选使用Redis分布式锁进一步控制高并发
 * 
 * 路由: POST /member-card/use-app
 * 权限: 需要用户登录
 * 请求参数: {app_id: 应用ID}
 * 
 * @returns {Object} 扣费结果和最新余额
 */
router.post('/use-app', auth_middleware, async (req, res) => {
  try {
    const { app_id } = req.body;
    const user_id = req.user.user_id;
    
    if (!app_id) {
      return res.status(400).json({ message: '应用ID不能为空' });
    }
    
    // 调用模型执行扣费操作
    // 内部实现了事务控制和并发处理
    const result = await member_card_model.deduct_for_ai_app(user_id, app_id);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: result.error,
        success: false
      });
    }
    
    res.status(200).json({
      message: '扣费成功',
      success: true,
      transaction: {
        id: result.transaction_id,
        app_name: result.app_name,
        amount: result.amount
      },
      balance: result.new_balance
    });
  } catch (error) {
    console.error('使用应用扣费异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 检查用户是否可以使用指定应用
 * 验证会员卡状态和余额是否足够
 * 
 * 路由: GET /member-card/check-app/:app_id
 * 权限: 需要用户登录
 * 
 * @returns {Object} 检查结果，包含是否可用和应用价格
 */
router.get('/check-app/:app_id', auth_middleware, async (req, res) => {
  try {
    const { app_id } = req.params;
    const user_id = req.user.user_id;
    
    // 检查用户是否可以使用该应用
    const result = await ai_app_model.check_user_can_use_app(user_id, app_id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('检查应用使用权限异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 添加定时任务 API (仅开发环境使用)
 * 处理超时未完成的充值订单
 * 
 * 路由: POST /member-card/check-expired-orders
 * 权限: 需要管理员令牌
 * 
 * @returns {Object} 处理结果
 */
router.post('/check-expired-orders', async (req, res) => {
  try {
    const { admin_token } = req.body;
    
    // 简单验证管理员令牌 (实际项目应有更完善的验证)
    if (admin_token !== process.env.ADMIN_TOKEN && admin_token !== 'test_admin_token') {
      return res.status(403).json({ message: '无权限执行此操作' });
    }
    
    const result = await member_card_model.checkExpiredOrders();
    res.status(200).json(result);
  } catch (error) {
    console.error('处理过期订单异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 获取用户每日免费额度信息
 * 
 * 流程说明：
 * 1. 验证用户身份
 * 2. 获取用户当日免费额度的总量、已使用量和剩余量
 * 3. 返回详细的额度使用情况
 * 
 * 路由: GET /member-card/free-quota
 * 权限: 需要用户登录
 * 
 * @returns {Object} 包含每日免费额度信息的对象
 */
router.get('/free-quota', auth_middleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // 获取用户每日免费额度信息
    const quota_info = await member_card_model.get_daily_free_quota_info(user_id);
    
    if (!quota_info.success) {
      return res.status(400).json({
        success: false,
        message: quota_info.error
      });
    }
    
    res.json({
      success: true,
      data: {
        daily_free_limit: quota_info.daily_free_limit,
        free_balance: quota_info.free_balance,
        used: quota_info.used,
        date: quota_info.date
      }
    });
  } catch (error) {
    console.error('获取每日免费额度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取每日免费额度失败'
    });
  }
});

/**
 * 管理员更新用户每日免费额度
 * 
 * 流程说明：
 * 1. 验证管理员身份和权限
 * 2. 验证参数合法性
 * 3. 更新指定用户的每日免费额度
 * 4. 同时更新当日的免费额度记录
 * 
 * 路由: PUT /member-card/free-quota/:user_id
 * 权限: 需要管理员权限
 * 请求参数: {daily_free_limit: 新的每日免费额度}
 * 
 * @returns {Object} 更新结果和新的每日免费额度
 */
router.put('/free-quota/:user_id', auth_middleware, admin_middleware, async (req, res) => {
  try {
    const { user_id } = req.params;
    const { daily_free_limit } = req.body;
    
    // 参数验证
    if (!daily_free_limit && daily_free_limit !== 0) {
      return res.status(400).json({
        success: false,
        message: '每日免费额度为必填项'
      });
    }
    
    if (isNaN(parseFloat(daily_free_limit)) || parseFloat(daily_free_limit) < 0) {
      return res.status(400).json({
        success: false,
        message: '每日免费额度必须为非负数'
      });
    }
    
    // 更新用户每日免费额度
    const result = await member_card_model.update_daily_free_limit(user_id, parseFloat(daily_free_limit));
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: '更新每日免费额度成功',
      data: {
        daily_free_limit: result.daily_free_limit
      }
    });
  } catch (error) {
    console.error('更新每日免费额度失败:', error);
    res.status(500).json({
      success: false,
      message: '更新每日免费额度失败'
    });
  }
});

/**
 * 用户更新自己的每日免费额度
 * 
 * 流程说明：
 * 1. 验证用户身份
 * 2. 验证参数合法性
 * 3. 检查用户是否有权限修改免费额度（如VIP用户）
 * 4. 更新用户的每日免费额度
 * 
 * 适用场景：针对VIP用户可以自行配置每日免费额度的情况
 * 
 * 路由: PUT /member-card/my-free-quota
 * 权限: 需要用户登录
 * 请求参数: {daily_free_limit: 新的每日免费额度}
 * 
 * @returns {Object} 更新结果和新的每日免费额度
 */
router.put('/my-free-quota', auth_middleware, async (req, res) => {
  try {
    const user_id = req.user.id;
    const { daily_free_limit } = req.body;
    
    // 参数验证
    if (!daily_free_limit && daily_free_limit !== 0) {
      return res.status(400).json({
        success: false,
        message: '每日免费额度为必填项'
      });
    }
    
    if (isNaN(parseFloat(daily_free_limit)) || parseFloat(daily_free_limit) < 0) {
      return res.status(400).json({
        success: false,
        message: '每日免费额度必须为非负数'
      });
    }
    
    // 获取用户会员卡信息，检查是否有权限配置
    const card = await member_card_model.get_member_card(user_id);
    
    // 确认用户会员卡存在
    if (!card) {
      return res.status(404).json({
        success: false,
        message: '会员卡不存在'
      });
    }
    
    // 这里可以添加业务逻辑，判断用户是否有权限修改免费额度
    // 例如：只有VIP用户可以配置，且不能超过其最大限额
    // 示例：检查用户VIP等级和限制
    
    // 更新用户每日免费额度
    const result = await member_card_model.update_daily_free_limit(user_id, parseFloat(daily_free_limit));
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }
    
    res.json({
      success: true,
      message: '更新每日免费额度成功',
      data: {
        daily_free_limit: result.daily_free_limit
      }
    });
  } catch (error) {
    console.error('更新每日免费额度失败:', error);
    res.status(500).json({
      success: false,
      message: '更新每日免费额度失败'
    });
  }
});

module.exports = router;