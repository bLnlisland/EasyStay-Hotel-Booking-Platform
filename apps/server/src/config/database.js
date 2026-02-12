// src/config/database.js - 数据库连接文件（增强版）
const { Sequelize } = require('sequelize');
const config = require('./config');

// 🔥 修复：清理环境变量中的空格/换行符
const env = (process.env.NODE_ENV || 'development').trim();
const dbConfig = config[env];

// 防御性编程：如果配置不存在则抛出明确错误
if (!dbConfig) {
  throw new Error(
    `❌ 找不到环境配置: "${env}"\n` +
    `   可用环境: ${Object.keys(config).join(', ')}\n` +
    `   请检查 NODE_ENV 环境变量是否正确设置。`
  );
}

// 创建 Sequelize 实例
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
    timezone: dbConfig.timezone || '+08:00',
    sync: { force: false, alter: false },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    }
  }
);

/**
 * 测试数据库连接
 */
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ 数据库连接成功！ (环境: ${env}, 数据库: ${dbConfig.database})`);
    console.log('💡 提示：数据库结构由 scripts/db-init.js 管理');
    console.log('💡 运行以下命令管理数据库：');
    console.log('   npm run db:init   # 初始化数据库结构');
    console.log('   npm run db:seed   # 插入测试数据');
    console.log('   npm run db:reset  # 重置整个数据库');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败：', error.message);

    // 更友好的错误提示
    switch (error.code) {
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('💡 请检查 MySQL 用户名和密码是否正确');
        break;
      case 'ER_BAD_DB_ERROR':
        console.error(`💡 数据库 "${dbConfig.database}" 不存在，请先创建数据库`);
        console.error(`💡 运行：node scripts/db-init.js init`);
        break;
      case 'ECONNREFUSED':
        console.error('💡 无法连接到 MySQL 服务器，请确保 MySQL 服务已启动');
        console.error('💡 在 Windows 上：net start mysql');
        console.error('💡 在 Mac/Linux 上：sudo service mysql start');
        break;
      case 'ER_TOO_MANY_KEYS':
        console.error('💡 索引数量过多错误，请运行：npm run db:reset');
        break;
      default:
        console.error('💡 请检查：');
        console.error('   1. MySQL 服务是否运行');
        console.error('   2. 数据库配置是否正确');
        console.error('   3. 防火墙是否阻止了连接');
    }
    return false;
  }
};

module.exports = { sequelize, testConnection, Sequelize };