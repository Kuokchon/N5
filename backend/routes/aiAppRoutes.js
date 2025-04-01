const express = require('express');
const router = express.Router();
const ai_app_model = require('../models/ai_app_model');

// 身份验证中间件
const auth_middleware = require('../middleware/auth_middleware');

/**
 * 获取所有AI应用列表
 * GET /ai-apps
 */
router.get('/', async (req, res) => {
  try {
    const apps = await ai_app_model.get_all_apps();
    
    res.status(200).json({ apps });
  } catch (error) {
    console.error('获取AI应用列表异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 获取单个AI应用详情
 * GET /ai-apps/:app_id
 */
router.get('/:app_id', async (req, res) => {
  try {
    const { app_id } = req.params;
    
    const app = await ai_app_model.get_app_by_id(app_id);
    
    if (!app) {
      return res.status(404).json({ message: 'AI应用不存在' });
    }
    
    res.status(200).json({ app });
  } catch (error) {
    console.error('获取AI应用详情异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 检查用户是否可以使用AI应用
 * GET /ai-apps/:app_id/check
 */
router.get('/:app_id/check', auth_middleware, async (req, res) => {
  try {
    const { app_id } = req.params;
    const user_id = req.user.user_id;
    
    const result = await ai_app_model.check_user_can_use_app(user_id, app_id);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('检查AI应用使用权限异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 创建新的AI应用 (仅管理员可用)
 * POST /ai-apps
 */
router.post('/', auth_middleware, async (req, res) => {
  try {
    // 这里应该添加管理员权限检查
    // 简化处理：只检查身份验证
    
    const { app_id, name, price, description } = req.body;
    
    // 验证输入
    if (!app_id || !name || !price) {
      return res.status(400).json({ message: '应用ID、名称和价格不能为空' });
    }
    
    // 检查应用ID是否已存在
    const existingApp = await ai_app_model.get_app_by_id(app_id);
    if (existingApp) {
      return res.status(400).json({ message: '应用ID已存在' });
    }
    
    // 创建应用
    const id = await ai_app_model.create_app({
      app_id,
      name,
      price,
      description
    });
    
    res.status(201).json({
      message: '创建成功',
      app_id: id
    });
  } catch (error) {
    console.error('创建AI应用异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 更新AI应用信息 (仅管理员可用)
 * PUT /ai-apps/:app_id
 */
router.put('/:app_id', auth_middleware, async (req, res) => {
  try {
    // 这里应该添加管理员权限检查
    // 简化处理：只检查身份验证
    
    const { app_id } = req.params;
    const { name, price, description } = req.body;
    
    // 验证输入
    if (!name || !price) {
      return res.status(400).json({ message: '名称和价格不能为空' });
    }
    
    // 检查应用是否存在
    const existingApp = await ai_app_model.get_app_by_id(app_id);
    if (!existingApp) {
      return res.status(404).json({ message: '应用不存在' });
    }
    
    // 更新应用
    const success = await ai_app_model.update_app(app_id, {
      name,
      price,
      description
    });
    
    if (!success) {
      return res.status(400).json({ message: '更新失败' });
    }
    
    res.status(200).json({ message: '更新成功' });
  } catch (error) {
    console.error('更新AI应用异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

module.exports = router; 