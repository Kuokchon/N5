/**
 * 用户头像路由
 * 
 * 本模块提供用户头像相关的API接口，包括：
 * 1. 上传头像
 * 2. 获取头像
 * 3. 查看头像历史记录
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// 导入中间件和模型
const auth_middleware = require('../middleware/auth_middleware');
const { upload, handleUploadError } = require('../middleware/upload_middleware');
const user_avatar_model = require('../models/user_avatar_model');

/**
 * 上传头像
 * 
 * PUT /users/:userId/avatar
 * 需要用户身份验证，只能上传自己的头像（除非是管理员）
 * 
 * @param {File} file - 上传的图片文件
 * @returns {Object} - 上传结果，包含新头像URL
 */
router.put('/:userId/avatar', 
  auth_middleware, 
  (req, res, next) => {
    console.log('===== 头像上传权限检查 =====');
    console.log('请求URL:', req.originalUrl);
    console.log('请求头Authorization:', req.headers.authorization ? `Bearer ${req.headers.authorization.split(' ')[1].substring(0, 10)}...` : '无');
    console.log('请求参数userId:', req.params.userId, `(${typeof req.params.userId})`);
    
    // 进一步调试请求详情
    console.log('请求方法:', req.method);
    console.log('请求内容类型:', req.headers['content-type']);
    console.log('请求体存在:', !!req.body);
    
    // 安全地打印用户信息，防止undefined错误
    if (req.user) {
      console.log('JWT解析后的用户信息:', JSON.stringify(req.user));
      console.log('用户ID字段:', `id=${req.user.id}, user_id=${req.user.user_id}`);
    } else {
      console.log('JWT解析后的用户信息: 未找到');
    }
    
    // 检查权限 - 只能上传自己的头像，除非是管理员
    try {
      // 将字符串ID转换为数字
      const requestedUserId = parseInt(req.params.userId, 10);
      console.log('解析后的请求用户ID:', requestedUserId);
      
      // 获取当前用户ID (兼容id和user_id字段)
      let currentUserId;
      if (req.user && req.user.id) {
        currentUserId = parseInt(req.user.id, 10);
      } else if (req.user && req.user.user_id) {
        currentUserId = parseInt(req.user.user_id, 10);
      } else {
        throw new Error('JWT中未找到用户ID');
      }
      
      console.log('当前用户ID:', currentUserId);
      
      // 获取用户角色
      const userRole = req.user && req.user.role;
      console.log('用户角色:', userRole || '普通用户');
      
      // 临时调试：在开发环境中，如果表单中包含debug=true则绕过验证
      const isDebugMode = req.body && req.body.debug === 'true';
      if (isDebugMode && process.env.NODE_ENV !== 'production') {
        console.log('⚠️ 调试模式：绕过权限验证');
        return next();
      }
      
      // 检查是否为同一用户或管理员
      const isSameUser = requestedUserId === currentUserId;
      const isAdmin = userRole === 'admin';
      
      console.log('是否为同一用户:', isSameUser);
      console.log('是否为管理员:', isAdmin);
      
      // 验证权限
      if (!isSameUser && !isAdmin) {
        console.log('权限验证失败: 无权修改其他用户头像');
        return res.status(403).json({
          success: false,
          message: '无权修改其他用户的头像'
        });
      }
      
      console.log('权限验证通过');
      next();
    } catch (error) {
      console.error('权限检查过程中发生错误:', error);
      return res.status(500).json({
        success: false,
        message: '权限验证过程中发生错误'
      });
    }
  },
  upload.single('avatar'), // 处理单个文件上传，字段名为avatar
  handleUploadError, // 处理上传错误
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '没有上传文件'
        });
      }
      
      const userId = parseInt(req.params.userId);
      
      // 调试信息：输出用户ID和JWT解析结果
      console.log('======= 头像上传处理 =======');
      console.log('参数中的用户ID:', userId);
      console.log('JWT中的用户ID:', req.user && req.user.id);
      console.log('文件信息:', req.file.originalname, req.file.size);
      
      // 处理头像上传
      const result = await user_avatar_model.upload_avatar(userId, req.file);
      
      res.status(200).json({
        success: true,
        message: '头像上传成功',
        data: result
      });
    } catch (error) {
      console.error('头像上传失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '头像上传处理失败'
      });
    }
  }
);

/**
 * 获取用户头像信息
 * 
 * GET /users/:userId/avatar
 * 公开API，不需要身份验证
 * 
 * @returns {Object} - 头像信息
 */
router.get('/:userId/avatar', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const avatarInfo = await user_avatar_model.get_avatar(userId);
    
    res.status(200).json({
      success: true,
      data: avatarInfo
    });
  } catch (error) {
    console.error('获取头像信息失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取头像信息失败'
    });
  }
});

/**
 * 获取用户头像历史记录
 * 
 * GET /users/:userId/avatar/history
 * 需要用户身份验证，只能查看自己的历史记录（除非是管理员）
 * 
 * @returns {Array} - 头像历史记录列表
 */
router.get('/:userId/avatar/history', auth_middleware, async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    const currentUserId = parseInt(req.user.id);
    
    // 检查权限 - 只能查看自己的历史记录，除非是管理员
    if (requestedUserId !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权查看其他用户的头像历史'
      });
    }
    
    const history = await user_avatar_model.get_avatar_history(requestedUserId);
    
    res.status(200).json({
      success: true,
      data: {
        items: history,
        count: history.length
      }
    });
  } catch (error) {
    console.error('获取头像历史失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '获取头像历史失败'
    });
  }
});

/**
 * 获取实际头像图片
 * 作为静态资源提供，在需要直接访问头像文件时使用
 * 
 * GET /users/:userId/avatar/image
 * 公开API，不需要身份验证
 * 
 * 返回：图片文件或重定向到默认头像
 */
router.get('/:userId/avatar/image', async (req, res) => {
  try {
    console.log('获取用户头像图片, 用户ID:', req.params.userId);
    
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      console.log('无效的用户ID, 返回默认头像');
      return res.redirect('/default-avatar.png');
    }
    
    // 获取头像信息
    let avatarInfo;
    try {
      avatarInfo = await user_avatar_model.get_avatar(userId);
      console.log('获取到头像信息:', avatarInfo);
    } catch (error) {
      console.error('获取头像信息失败:', error);
      return res.redirect('/default-avatar.png');
    }
    
    const { avatar_url } = avatarInfo;
    
    // 如果是默认头像或外部URL
    if (!avatar_url || avatar_url === '/default-avatar.png' || avatar_url.startsWith('http')) {
      console.log('使用默认头像或外部URL:', avatar_url || '/default-avatar.png');
      // 使用绝对路径指向默认头像
      const defaultAvatarPath = path.join(__dirname, '../public/default-avatar.png');
      // 检查默认头像文件是否存在
      try {
        await fs.access(defaultAvatarPath);
        console.log('发送默认头像文件:', defaultAvatarPath);
        return res.sendFile(defaultAvatarPath);
      } catch (error) {
        console.error('默认头像文件不存在:', error);
        // 返回简单的文本响应代替图片
        return res.status(404).send('Default avatar not found');
      }
    }
    
    // 本地文件
    const filename = path.basename(avatar_url);
    const filepath = path.join(__dirname, '../public/avatars', filename);
    console.log('尝试访问本地文件:', filepath);
    
    try {
      await fs.access(filepath);
      console.log('文件存在，发送文件');
      return res.sendFile(filepath);
    } catch (error) {
      console.error('文件不存在，返回默认头像:', error);
      return res.redirect('/default-avatar.png');
    }
  } catch (error) {
    console.error('获取头像图片处理失败:', error);
    return res.redirect('/default-avatar.png');
  }
});

module.exports = router; 