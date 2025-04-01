/**
 * 管理员权限中间件
 * 
 * 验证用户是否拥有管理员权限
 * 需要在auth_middleware之后使用
 */

const pool = require('../config/mysql');

const admin_middleware = async (req, res, next) => {
  try {
    // 确保用户已登录且有用户信息
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: '未授权访问'
      });
    }
    
    // 查询用户是否有管理员权限
    const [rows] = await pool.query(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!rows.length || rows[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '没有管理员权限'
      });
    }
    
    // 权限验证通过，继续下一个中间件
    next();
  } catch (error) {
    console.error('管理员权限验证失败:', error);
    return res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = admin_middleware;