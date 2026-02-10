// src/config/database.js - 数据库连接文件（修改版）
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
    // 关键配置：禁用所有自动同步
    sync: {
      force: false,
      alter: false
    },
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
    
    // ⚠️ 重要：移除自动同步代码！数据库结构由 init.sql 和 db-init.js 管理
    // 开发环境下不要自动同步表结构
    // if (env === 'development') {
    //   await sequelize.sync({ alter: true });
    //   console.log('数据库表已同步');
    // }
    
    console.log('💡 提示：数据库结构由 scripts/db-init.js 管理');
    console.log('💡 运行以下命令管理数据库：');
    console.log('   npm run db:init   # 初始化数据库结构');
    console.log('   npm run db:seed   # 插入测试数据');
    console.log('   npm run db:reset  # 重置整个数据库');
    
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
        console.error(`💡 运行：node scripts/db-init.js init`);
        break;
      case 'ECONNREFUSED':
        console.error('💡 无法连接到MySQL服务器，请确保MySQL服务已启动');
        console.error('💡 在Windows上：net start mysql');
        console.error('💡 在Mac/Linux上：sudo service mysql start');
        break;
      case 'ER_TOO_MANY_KEYS':
        console.error('💡 索引数量过多错误，请运行：npm run db:reset');
        console.error('💡 这会重置数据库并使用正确的结构重新创建');
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