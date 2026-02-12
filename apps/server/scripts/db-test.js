const mysql = require('mysql2/promise');
require('dotenv').config();
const config = require('../src/config/config');

async function testConnection() {
  const env = (process.env.NODE_ENV || 'development').trim();
  const dbConfig = config[env];

  if (!dbConfig) {
    console.error(`❌ 无效环境: "${env}"，可用环境: ${Object.keys(config).join(', ')}`);
    process.exit(1);
  }

  console.log(`🌍 当前环境: ${env}`);
  console.log('📋 数据库配置:');
  console.log(`  Host: ${dbConfig.host}`);
  console.log(`  Port: ${dbConfig.port}`);
  console.log(`  User: ${dbConfig.username}`);
  console.log(`  Database: ${dbConfig.database}`);

  try {
    // 先连接服务器（不指定数据库）
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password
    });

    console.log('✅ MySQL服务器连接成功！');

    // 🟢 修复1：使用 dbConfig.database 而非 config.database
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [dbConfig.database]);

    if (databases.length === 0) {
      console.log(`⚠️  数据库 "${dbConfig.database}" 不存在`);
      console.log('💡 请运行初始化命令创建数据库:');
      console.log(`   NODE_ENV=${env} node scripts/db-init.js init`);
    } else {
      console.log(`✅ 数据库 "${dbConfig.database}" 存在`);

      // 切换到数据库
      await connection.changeUser({ database: dbConfig.database });

      // 检查表
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`📊 数据库中有 ${tables.length} 张表:`);

      for (const table of tables) {
        const tableName = Object.values(table)[0];
        // 🟢 修复2：使用反引号包裹表名，避免保留字冲突
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(`  - ${tableName}: ${rows[0].count} 条记录`);
      }
    }

    await connection.end();
    console.log('🎉 数据库测试完成！');

  } catch (error) {
    console.error('❌ 数据库连接测试失败:');

    switch (error.code) {
      case 'ER_ACCESS_DENIED_ERROR':
        console.error('💡 用户名或密码错误');
        console.error('💡 请检查 .env 文件中的 DB_USER 和 DB_PASSWORD 配置');
        break;
      case 'ECONNREFUSED':
        console.error('💡 无法连接到MySQL服务器');
        console.error('💡 请确保MySQL服务正在运行:');
        console.error('   Windows: net start mysql');
        console.error('   Mac/Linux: sudo service mysql start');
        console.error('   or: mysql.server start');
        break;
      case 'ER_BAD_DB_ERROR':
        console.error('💡 数据库不存在');
        break;
      default:
        console.error(`错误代码: ${error.code}`);
        console.error(`错误信息: ${error.message}`);
    }

    console.error('\n💡 常见解决方案:');
    console.error('1. 确保MySQL服务正在运行');
    console.error('2. 检查 .env 文件中的数据库配置');
    console.error('3. 检查防火墙设置');
    console.error('4. 确保MySQL用户有足够的权限');

    process.exit(1);
  }
}

testConnection();