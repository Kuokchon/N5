const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const user_model = require('../models/user_model');
const auth_middleware = require('../middleware/auth_middleware');
const pool = require('../config/mysql');

/**
 * 用户注册
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // 验证输入
    if (!username || !email || !password) {
      return res.status(400).json({ message: '用户名、邮箱和密码不能为空' });
    }
    
    // 检查邮箱是否已被使用
    const existingEmail = await user_model.find_by_email(email);
    if (existingEmail) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }
    
    // 检查用户名是否已被使用
    const existingUsername = await user_model.find_by_username(username);
    if (existingUsername) {
      return res.status(400).json({ message: '该用户名已被使用' });
    }
    
    // 创建用户
    const userId = await user_model.create_user(username, email, password);
    
    res.status(201).json({ 
      message: '注册成功',
      user_id: userId
    });
  } catch (error) {
    console.error('注册异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 用户登录
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ message: '邮箱和密码不能为空' });
    }
    
    // 查找用户
    const user = await user_model.find_by_email(email);
    if (!user) {
      return res.status(401).json({ message: '邮箱或密码不正确' });
    }
    
    // 验证密码
    const isPasswordValid = await user_model.verify_password(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '邮箱或密码不正确' });
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { 
        user_id: user.id, 
        id: user.id, // 同时添加id字段以兼容前端
        email: user.email, 
        username: user.username,
        role: user.role || 'user' // 确保包含用户角色
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('登录异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 获取当前用户信息
 * GET /auth/me
 */
router.get('/me', async (req, res) => {
  try {
    // 从请求头获取token
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: '未授权，请先登录' });
    }
    
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查询用户信息
    const user = await user_model.find_by_id(decoded.user_id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '无效或过期的令牌，请重新登录' });
    }
    
    console.error('获取用户信息异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 更新用户简介
 * PUT /auth/profile/bio
 */
router.put('/profile/bio', auth_middleware, async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权，请先登录' });
    }
    
    // 验证简介长度
    if (bio && bio.length > 200) {
      return res.status(400).json({ message: '个人简介不能超过200个字符' });
    }
    
    const success = await user_model.update_bio(userId, bio);
    
    if (success) {
      res.status(200).json({ 
        message: '个人简介更新成功',
        bio
      });
    } else {
      res.status(400).json({ message: '更新失败，请稍后再试' });
    }
  } catch (error) {
    console.error('更新个人简介异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 更新用户密码
 * PUT /auth/profile/password
 */
router.put('/profile/password', auth_middleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权，请先登录' });
    }
    
    // 验证输入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: '当前密码和新密码不能为空' });
    }
    
    // 验证密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({ message: '新密码长度不能少于6个字符' });
    }
    
    // 获取用户当前密码
    const [userRows] = await pool.query(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );
    
    if (!userRows.length) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 验证当前密码
    const isPasswordValid = await user_model.verify_password(currentPassword, userRows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '当前密码不正确' });
    }
    
    // 更新密码
    const success = await user_model.update_password(userId, newPassword);
    
    if (success) {
      res.status(200).json({ message: '密码更新成功' });
    } else {
      res.status(400).json({ message: '更新失败，请稍后再试' });
    }
  } catch (error) {
    console.error('更新密码异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 绑定手机号
 * PUT /auth/profile/phone
 */
router.put('/profile/phone', auth_middleware, async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权，请先登录' });
    }
    
    // 验证手机号格式
    if (!phone || !/^\d{11}$/.test(phone)) {
      return res.status(400).json({ message: '请输入有效的手机号码' });
    }
    
    try {
      const success = await user_model.bind_phone(userId, phone);
      
      if (success) {
        res.status(200).json({ 
          message: '手机号绑定成功',
          phone
        });
      } else {
        res.status(400).json({ message: '绑定失败，请稍后再试' });
      }
    } catch (bindError) {
      // 处理特定错误，如手机号已被绑定
      if (bindError.message.includes('已被其他用户绑定')) {
        return res.status(400).json({ message: bindError.message });
      }
      throw bindError;
    }
  } catch (error) {
    console.error('绑定手机号异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

/**
 * 绑定微信
 * PUT /auth/profile/wechat
 */
router.put('/profile/wechat', auth_middleware, async (req, res) => {
  try {
    const { wechat } = req.body;
    const userId = req.user.id || req.user.user_id;
    
    if (!userId) {
      return res.status(401).json({ message: '未授权，请先登录' });
    }
    
    // 验证微信账号格式
    if (!wechat || wechat.length < 3) {
      return res.status(400).json({ message: '请输入有效的微信账号' });
    }
    
    try {
      const success = await user_model.bind_wechat(userId, wechat);
      
      if (success) {
        res.status(200).json({ 
          message: '微信账号绑定成功',
          wechat
        });
      } else {
        res.status(400).json({ message: '绑定失败，请稍后再试' });
      }
    } catch (bindError) {
      // 处理特定错误，如微信账号已被绑定
      if (bindError.message.includes('已被其他用户绑定')) {
        return res.status(400).json({ message: bindError.message });
      }
      throw bindError;
    }
  } catch (error) {
    console.error('绑定微信账号异常:', error);
    res.status(500).json({ message: '服务器错误，请稍后再试' });
  }
});

module.exports = router;
 