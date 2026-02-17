// src/app.js - 主应用文件
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
console.log('静态目录：', path.join(__dirname, '..', 'uploads'));


// 导入路由
const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const db = require('./models');
const { sequelize } = db;

// 导入中间件
const { errorHandler } = require('./middlewares/auth');

// 导入数据库连接
const { testConnection } = require('./config/database');

// 创建Express应用
const app = express();

// 中间件配置
app.use(cors()); // 允许跨域请求
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

const uploadAbs = path.resolve('./uploads');
console.log('📁 serving /uploads from:', uploadAbs);
app.use('/uploads', express.static(uploadAbs));


// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'hotel-booking-api',
    version: '1.0.0'
  });
});

// API文档路由
app.get('/', (req, res) => {
  res.json({
    message: '欢迎使用易宿酒店预订平台后端API',
    version: '1.0.0',
    documentation: {
      base_url: `http://localhost:${process.env.PORT || 3000}/api`,
      endpoints: {
        auth: {
          register: 'POST /api/auth/register',
          login: 'POST /api/auth/login',
          profile: 'GET /api/auth/profile',
          logout: 'POST /api/auth/logout'
        },
        hotels: {
          public_list: 'GET /api/hotels/public',
          hotel_detail: 'GET /api/hotels/public/:id',
          search: 'GET /api/hotels/search',
          merchant_hotels: 'GET /api/hotels/my',
          create_hotel: 'POST /api/hotels',
          update_hotel: 'PUT /api/hotels/:id'
        }
      }
    }
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `路由 ${req.method} ${req.url} 不存在`
  });
});

// 全局错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.log('❌ 数据库连接失败，服务器无法启动');
      process.exit(1);
    }
    
    const PORT = process.env.PORT || 3000;
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => {
      console.log(`
🚀 服务器启动成功！
📍 本地地址: http://localhost:${PORT}
📚 API文档: http://localhost:${PORT}
🛢️  数据库: ${process.env.DB_NAME}
🌐 环境: ${process.env.NODE_ENV || 'development'}
📅 时间: ${new Date().toLocaleString()}
      `);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 启动服务器
startServer();

module.exports = app;