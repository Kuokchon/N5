const jwt = require('jsonwebtoken');

/**
 * 身份验证中间件
 * 验证请求头中的JWT令牌
 */
const auth_middleware = (req, res, next) => {
  try {
    console.log('===== JWT身份验证开始 =====');
    // 从Authorization头部获取令牌
    // 格式应为: "Bearer <token>"
    const authHeader = req.headers.authorization;
    console.log('Authorization头部:', authHeader ? `${authHeader.substring(0, 15)}...` : '未提供');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('身份验证失败: 无效的Authorization头部格式');
      return res.status(401).json({
        message: '未授权，请先登录',
        code: 'UNAUTHORIZED'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('提取的Token:', token ? `${token.substring(0, 10)}...` : '无效Token');
    
    if (!token) {
      console.log('身份验证失败: 未提供Token');
      return res.status(401).json({
        message: '未提供有效的令牌',
        code: 'TOKEN_MISSING'
      });
    }
    
    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT解码成功，用户信息:', JSON.stringify(decoded));
    
    // 将用户信息添加到请求对象中
    req.user = decoded;
    
    // 继续处理请求
    console.log('身份验证成功，继续处理请求');
    next();
  } catch (error) {
    console.log('JWT验证异常:', error.name);
    // 处理不同类型的JWT错误
    if (error.name === 'JsonWebTokenError') {
      console.log('无效的Token:', error.message);
      return res.status(401).json({
        message: '无效的令牌',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      console.log('Token已过期');
      return res.status(401).json({
        message: '令牌已过期，请重新登录',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('身份验证中间件异常:', error);
    return res.status(500).json({
      message: '服务器错误，请稍后再试',
      code: 'SERVER_ERROR'
    });
  }
};

module.exports = auth_middleware; 