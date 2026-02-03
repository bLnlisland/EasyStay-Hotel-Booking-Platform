// src/middlewares/auth.js - 认证中间件
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// 验证JWT令牌的中间件
const auth = async (req, res, next) => {
  try {
    // 从请求头获取令牌
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '访问被拒绝，未提供认证令牌'
      });
    }

    // 验证令牌
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 查找用户
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被删除'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: '用户账户已被禁用'
      });
    }

    // 将用户信息添加到请求对象
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('认证错误:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '认证令牌已过期，请重新登录'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
};

// 角色检查中间件
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `需要 ${roles.join(' 或 ')} 角色权限`
      });
    }

    next();
  };
};

// 错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || '服务器内部错误';
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 验证请求数据中间件
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  auth,
  roleCheck,
  errorHandler,
  validateRequest
};