// src/config/database.js - 数据库连接文件
const { Sequelize } = require('sequelize');
const config = require('./config');

// 获取当前环境配置
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    timezone: dbConfig.timezone,
    define: {
      timestamps: true,  // 自动添加 createdAt 和 updatedAt 字段
      underscored: true, // 使用下划线命名（created_at 而不是 createdAt）
      freezeTableName: true, // 禁用表名自动复数化
    }
  }
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功！');
    
    // 开发环境下自动同步表结构
    if (env === 'development') {
      // alter: true 会修改表结构以匹配模型，保留数据
      // force: true 会删除现有表并重新创建（慎用，会丢失数据！）
      await sequelize.sync({ alter: true });
      console.log('数据库表已同步');
    }
    
    return true;
  } catch (error) {
    console.error('数据库连接失败：', error.message);
    
    // 提供更友好的错误信息
    switch (error.code) {
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('💡 请检查MySQL用户名和密码是否正确');
        break;
      case 'ER_BAD_DB_ERROR':
        console.error(`💡 数据库 "${dbConfig.database}" 不存在，请先创建数据库`);
        console.error(`💡 运行：CREATE DATABASE ${dbConfig.database};`);
        break;
      case 'ECONNREFUSED':
        console.error('💡 无法连接到MySQL服务器，请确保MySQL服务已启动');
        console.error('💡 在Windows上：net start mysql');
        console.error('💡 在Mac/Linux上：sudo service mysql start');
        break;
      default:
        console.error('💡 请检查：');
        console.error('   1. MySQL服务是否运行');
        console.error('   2. 数据库配置是否正确');
        console.error('   3. 防火墙是否阻止了连接');
    }
    
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  Sequelize
};