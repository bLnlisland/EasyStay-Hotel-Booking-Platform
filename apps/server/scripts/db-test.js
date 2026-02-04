const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hotel_booking'
  };

  try {
    console.log('🔌 正在测试数据库连接...');
    console.log('配置信息:');
    console.log(`  Host: ${config.host}`);
    console.log(`  Port: ${config.port}`);
    console.log(`  User: ${config.user}`);
    console.log(`  Database: ${config.database}`);
    
    // 测试连接
    const connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password
    });
    
    console.log('✅ MySQL服务器连接成功！');
    
    // 检查数据库是否存在
    const [databases] = await connection.query('SHOW DATABASES LIKE ?', [config.database]);
    
    if (databases.length === 0) {
      console.log(`⚠️  数据库 "${config.database}" 不存在`);
      console.log('💡 运行以下命令创建数据库:');
      console.log(`   CREATE DATABASE ${config.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    } else {
      console.log(`✅ 数据库 "${config.database}" 存在`);
      
      // 切换到数据库
      await connection.changeUser({ database: config.database });
      
      // 检查表
      const [tables] = await connection.query('SHOW TABLES');
      console.log(`📊 数据库中有 ${tables.length} 张表:`);
      
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
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