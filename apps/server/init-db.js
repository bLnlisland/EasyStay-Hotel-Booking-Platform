// scripts/init-db.js - 数据库初始化脚本
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  try {
    // 创建数据库连接（不指定数据库）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('🔗 连接到MySQL服务器...');

    // 创建数据库
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
    console.log(`✅ 数据库 ${process.env.DB_NAME} 已创建或已存在`);

    // 切换到目标数据库
    await connection.query(`USE ${process.env.DB_NAME}`);
    console.log(`✅ 切换到数据库 ${process.env.DB_NAME}`);

    // 关闭连接
    await connection.end();
    console.log('✅ 数据库初始化完成！');
    
    console.log('\n📋 接下来请运行以下命令：');
    console.log('   npm run dev  # 启动开发服务器');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

// 执行初始化
initDatabase();