/**
 * 管理员路由
 * 
 * 处理与管理员操作相关的路由，包括认证、用户管理、内容管理等
 */

const express = require('express');
const router = express.Router();
const adminModel = require('../models/admin_model');
const operationLogModel = require('../models/operation_log_model');
const jwt = require('jsonwebtoken');
const { authenticateAdmin } = require('../middleware/authMiddleware');
const config = require('../config/config');

// 处理管理员登录
router.post('/login', async (req, res) => {
  try {
    console.log('管理員登錄請求:', {
      username: req.body.username,
      password: req.body.password ? '[已提供]' : '[未提供]'
    });
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('登錄錯誤: 缺少用戶名或密碼');
      return res.status(400).json({ error: '用户名和密码都是必需的' });
    }
    
    // 驗證從users表中提取管理員憑據
    console.log('嘗試驗證管理員憑據...');
    try {
      const admin = await adminModel.verify_admin_credentials(username, password);
      
      if (!admin) {
        console.log('登錄錯誤: 憑據無效或用戶不是管理員');
        return res.status(401).json({ error: '無效的憑據或用戶不是管理員' });
      }
      
      console.log('管理員驗證成功:', { id: admin.id, username: admin.username, role: admin.role });
      
      // 创建JWT令牌
      const token = jwt.sign(
        { 
          id: admin.id, 
          username: admin.username, 
          role: admin.role,
          type: 'admin' 
        },
        config.jwtSecret,
        { expiresIn: '24h' }
      );
      
      console.log('JWT令牌創建成功');
      
      // 记录操作日志
      try {
        await operationLogModel.create_log({
          admin_id: admin.id,
          admin_username: admin.username,
          action: 'admin_login',
          resource_type: 'admin',
          details: { 
            ip: req.ip || 'unknown',
            user_agent: req.headers['user-agent'] || 'unknown'
          }
        });
        console.log('操作日誌記錄成功');
      } catch (logError) {
        console.error('記錄登錄日誌錯誤 (非阻斷性):', logError);
      }
      
      // 返回令牌和管理员信息
      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (verifyError) {
      console.error('管理員憑據驗證錯誤:', verifyError);
      return res.status(500).json({ error: '登錄驗證過程中發生錯誤', details: verifyError.message });
    }
  } catch (error) {
    console.error('管理员登录处理错误:', error);
    res.status(500).json({ error: '登录过程中发生错误', details: error.message });
  }
});

// 获取当前管理员信息
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    // 获取完整的管理员信息
    const admin = await adminModel.get_admin_by_id(req.admin.id);
    
    if (!admin) {
      return res.status(404).json({ error: '管理员不存在' });
    }
    
    res.json({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      created_at: admin.created_at,
      last_login_time: admin.last_login_time
    });
  } catch (error) {
    console.error('获取管理员信息错误:', error);
    res.status(500).json({ error: '获取管理员信息时发生错误' });
  }
});

// 管理员登出
router.post('/logout', authenticateAdmin, async (req, res) => {
  try {
    // 记录操作日志
    await operationLogModel.create_log({
      admin_id: req.admin.id,
      admin_username: req.admin.username,
      action: 'admin_logout',
      resource_type: 'admin',
      details: { 
        ip: req.ip || 'unknown',
        user_agent: req.headers['user-agent'] || 'unknown'
      }
    });
    
    res.json({ message: '成功登出' });
  } catch (error) {
    console.error('管理员登出错误:', error);
    res.status(500).json({ error: '登出过程中发生错误' });
  }
});

// 以下路由需要管理员权限

// 获取管理员列表
router.get('/admins', authenticateAdmin, async (req, res) => {
  try {
    // 检查是否为超级管理员
    if (req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: '无权访问此资源' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    // 过滤条件
    const filters = {};
    if (req.query.role) filters.role = req.query.role;
    if (req.query.search) filters.search = req.query.search;
    
    const admins = await adminModel.get_admin_list(page, limit, filters);
    
    res.json(admins);
  } catch (error) {
    console.error('获取管理员列表错误:', error);
    res.status(500).json({ error: '获取管理员列表时发生错误' });
  }
});

// 创建新管理员
router.post('/admins', authenticateAdmin, async (req, res) => {
  try {
    // 检查是否为超级管理员
    if (req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: '无权创建管理员账户' });
    }
    
    const { username, password, email, role } = req.body;
    
    // 验证必填字段
    if (!username || !password || !email || !role) {
      return res.status(400).json({ error: '所有字段都是必需的' });
    }
    
    // 验证角色是否有效
    if (!Object.values(adminModel.ADMIN_ROLES).includes(role)) {
      return res.status(400).json({ error: '无效的管理员角色' });
    }
    
    // 创建管理员
    const newAdmin = await adminModel.create_admin({
      username,
      password,
      email,
      role
    });
    
    // 记录操作日志
    await operationLogModel.create_log({
      admin_id: req.admin.id,
      admin_username: req.admin.username,
      action: 'create_admin',
      resource_type: 'admin',
      resource_id: newAdmin.id,
      details: { 
        created_admin: username,
        role: role,
        is_new: newAdmin.is_new
      }
    });
    
    res.status(201).json({
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email,
      role: newAdmin.role
    });
  } catch (error) {
    console.error('创建管理员错误:', error);
    
    if (error.message === '用户名已存在') {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ error: '创建管理员时发生错误' });
  }
});

// 将用户提升为管理员
router.post('/admins/promote/:userId', authenticateAdmin, async (req, res) => {
  try {
    // 检查是否为超级管理员
    if (req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: '无权提升用户为管理员' });
    }
    
    const userId = parseInt(req.params.userId);
    const { role } = req.body;
    
    // 验证角色是否有效
    if (!role || !Object.values(adminModel.ADMIN_ROLES).includes(role)) {
      return res.status(400).json({ error: '无效的管理员角色' });
    }
    
    // 提升用户为管理员
    const success = await adminModel.promote_user_to_admin(userId, role);
    
    if (!success) {
      return res.status(404).json({ error: '用户不存在或操作失败' });
    }
    
    // 记录操作日志
    await operationLogModel.create_log({
      admin_id: req.admin.id,
      admin_username: req.admin.username,
      action: 'promote_admin',
      resource_type: 'user',
      resource_id: userId,
      details: { role }
    });
    
    res.json({ message: '用户已成功提升为管理员', role });
  } catch (error) {
    console.error('提升用户为管理员错误:', error);
    res.status(500).json({ error: '提升用户为管理员时发生错误' });
  }
});

// 更新管理员信息
router.put('/admins/:id', authenticateAdmin, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    
    // 检查权限（只有超级管理员可以修改其他管理员，管理员可以修改自己的信息）
    if (req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN && req.admin.id !== adminId) {
      return res.status(403).json({ error: '无权修改此管理员账户' });
    }
    
    // 只允许超级管理员修改角色
    if (req.body.role && req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: '只有超级管理员可以修改角色' });
    }
    
    // 验证角色是否有效
    if (req.body.role && !Object.values(adminModel.ADMIN_ROLES).includes(req.body.role)) {
      return res.status(400).json({ error: '无效的管理员角色' });
    }
    
    // 更新管理员信息
    const success = await adminModel.update_admin(adminId, req.body);
    
    if (!success) {
      return res.status(404).json({ error: '管理员不存在或无内容更新' });
    }
    
    // 记录操作日志
    await operationLogModel.create_log({
      admin_id: req.admin.id,
      admin_username: req.admin.username,
      action: 'update_admin',
      resource_type: 'admin',
      resource_id: adminId,
      details: { 
        updated_fields: Object.keys(req.body),
        self_update: req.admin.id === adminId
      }
    });
    
    res.json({ message: '管理员信息已更新' });
  } catch (error) {
    console.error('更新管理员错误:', error);
    res.status(500).json({ error: '更新管理员信息时发生错误' });
  }
});

// 删除管理员（或降级为普通用户）
router.delete('/admins/:id', authenticateAdmin, async (req, res) => {
  try {
    const adminId = parseInt(req.params.id);
    
    // 检查是否为超级管理员
    if (req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: '无权删除管理员账户' });
    }
    
    // 防止删除自己
    if (req.admin.id === adminId) {
      return res.status(400).json({ error: '不能删除自己的管理员账户' });
    }
    
    // 删除管理员（降级为普通用户）
    const success = await adminModel.delete_admin(adminId);
    
    if (!success) {
      return res.status(404).json({ error: '管理员不存在或删除失败' });
    }
    
    // 记录操作日志
    await operationLogModel.create_log({
      admin_id: req.admin.id,
      admin_username: req.admin.username,
      action: 'delete_admin',
      resource_type: 'admin',
      resource_id: adminId
    });
    
    res.json({ message: '管理员已降级为普通用户' });
  } catch (error) {
    console.error('删除管理员错误:', error);
    res.status(500).json({ error: '删除管理员时发生错误' });
  }
});

// 获取操作日志列表
router.get('/operation-logs', authenticateAdmin, async (req, res) => {
  try {
    // 检查是否为超级管理员
    if (req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: '无权访问操作日志' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    // 过滤条件
    const filters = {};
    if (req.query.action) filters.action = req.query.action;
    if (req.query.admin_id) filters.admin_id = parseInt(req.query.admin_id);
    if (req.query.start_date) filters.start_date = new Date(req.query.start_date);
    if (req.query.end_date) filters.end_date = new Date(req.query.end_date);
    
    const logs = await operationLogModel.get_logs(page, limit, filters);
    
    res.json(logs);
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({ error: '获取操作日志时发生错误' });
  }
});

// 检查用户是否为管理员
router.get('/check-admin/:userId', authenticateAdmin, async (req, res) => {
  try {
    // 检查是否为超级管理员
    if (req.admin.role !== adminModel.ADMIN_ROLES.SUPER_ADMIN) {
      return res.status(403).json({ error: '无权执行此操作' });
    }
    
    const userId = parseInt(req.params.userId);
    const isAdmin = await adminModel.is_admin(userId);
    
    res.json({ is_admin: isAdmin });
  } catch (error) {
    console.error('检查用户管理员状态错误:', error);
    res.status(500).json({ error: '检查用户管理员状态时发生错误' });
  }
});

module.exports = router;