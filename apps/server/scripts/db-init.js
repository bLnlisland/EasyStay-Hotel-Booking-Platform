const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();
//数据库配置，从环境变量读取，提供默认值
class DatabaseManager {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '12345',
      database: process.env.DB_NAME || 'hotel_booking'
    };
  }
//useDatabase - 是否连接到具体数据库
  async connect(useDatabase = true) {
    const connectionConfig = {
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password
    };
    
    // 根据参数决定是否连接到具体数据库
    if (useDatabase && this.config.database) {
      connectionConfig.database = this.config.database;
    }
    
    this.connection = await mysql.createConnection(connectionConfig);
    
    if (useDatabase && this.config.database) {
      console.log(`✅ 已连接到MySQL服务器 (数据库: ${this.config.database})`);
    } else {
      console.log('✅ 已连接到MySQL服务器');
    }
  }
  //初始化数据库结构
  async initDatabase() {
    try {
      // 读取SQL文件
      const sqlPath = path.join(__dirname, '../migrations/init.sql');
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      
      console.log('🔍 开始解析SQL文件...');
      
      // 使用改进的SQL语句分割逻辑
      const sqlStatements = this.parseSQLStatements(sqlContent);
      
      console.log(`📝 开始执行 ${sqlStatements.length} 条SQL语句...`);
      
      for (let i = 0; i < sqlStatements.length; i++) {
        const statement = sqlStatements[i];
        try {
          // 显示简化的语句信息
          const firstLine = statement.trim().split('\n')[0];
          const displayText = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
          console.log(`执行中 (${i + 1}/${sqlStatements.length}): ${displayText}`);
          
          await this.connection.query(statement);
          console.log(`✅ 执行成功 (${i + 1}/${sqlStatements.length})`);
        } catch (error) {
          console.error(`❌ SQL语句执行失败 (${i + 1}/${sqlStatements.length}): ${error.message}`);
          // 显示更多调试信息
          console.error(`语句前50个字符: ${statement.substring(0, 50)}...`);
        }
      }
      
      console.log('🎉 数据库初始化完成！');
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
      throw error;
    }
  }

  // 改进的SQL解析方法
  parseSQLStatements(sqlContent) {
    const statements = [];
    let currentStatement = '';
    let inComment = false;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < sqlContent.length; i++) {
      const char = sqlContent[i];
      const nextChar = i < sqlContent.length - 1 ? sqlContent[i + 1] : '';
      
      // 处理注释
      if (!inString && !inComment && char === '-' && nextChar === '-') {
        inComment = true;
        i++; // 跳过下一个字符
        continue;
      }
      
      if (!inString && inComment && char === '\n') {
        inComment = false;
        continue;
      }
      
      if (!inString && !inComment && char === '/' && nextChar === '*') {
        inComment = true;
        i++; // 跳过下一个字符
        continue;
      }
      
      if (!inString && inComment && char === '*' && nextChar === '/') {
        inComment = false;
        i++; // 跳过下一个字符
        continue;
      }
      
      if (inComment) {
        continue;
      }
      
      // 处理字符串
      if (!inString && (char === "'" || char === '"' || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && sqlContent[i - 1] !== '\\') {
        inString = false;
      }
      
      // 添加字符到当前语句
      currentStatement += char;
      
      // 检查语句结束（分号且不在字符串中）
      if (char === ';' && !inString) {
        const trimmedStatement = currentStatement.trim();
        if (trimmedStatement.length > 0) {
          statements.push(trimmedStatement);
        }
        currentStatement = '';
      }
    }
    
    // 处理最后一个语句（如果没有分号）
    const trimmedStatement = currentStatement.trim();
    if (trimmedStatement.length > 0) {
      statements.push(trimmedStatement);
    }
    
    // 过滤掉空语句和纯注释
    const filteredStatements = statements.filter(stmt => {
      const cleanStmt = stmt.replace(/--.*$/gm, '').trim();
      return cleanStmt.length > 0 && !cleanStmt.startsWith('/*');
    });
    
    console.log(`🔍 解析完成，找到 ${filteredStatements.length} 条SQL语句`);
    
    // 调试：显示所有语句
    console.log('📋 解析出的SQL语句:');
    filteredStatements.forEach((stmt, idx) => {
      console.log(`  ${idx + 1}: ${stmt.substring(0, 80).replace(/\n/g, ' ')}...`);
    });
    
    return filteredStatements;
  }

  async seedDatabase() {
    try {
      // 确保使用正确的数据库
      if (!this.connection.config.database) {
        await this.connection.query(`USE ${this.config.database};`);
        console.log(`📁 使用数据库: ${this.config.database}`);
      }
      
      const bcrypt = require('bcryptjs');
      
      // 生成密码哈希
      const adminPassword = await bcrypt.hash('admin123', 10);
      const merchantPassword = await bcrypt.hash('merchant123', 10);
      const userPassword = await bcrypt.hash('user123', 10);
      
      // 插入测试数据（注意：order是MySQL保留字，需要用反引号括起来）
      const seedData = [
        `INSERT INTO users (username, email, password, role, full_name, phone, avatar, is_active) VALUES
        ('admin', 'admin@hotel.com', '${adminPassword}', 'admin', '系统管理员', '13800138000', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/icons/person-circle.svg', true),
        ('merchant1', 'merchant@hotel.com', '${merchantPassword}', 'merchant', '酒店商户', '13800138001', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/icons/person-circle.svg', true),
        ('user1', 'user@example.com', '${userPassword}', 'user', '普通用户', '13800138002', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/icons/person-circle.svg', true)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;`,
        
        `INSERT INTO hotels (merchant_id, name_zh, name_en, address, city, province, star_rating, opening_year, facilities, status, contact_phone, contact_email) VALUES
        (2, '上海外滩大酒店', 'Shanghai Bund Hotel', '上海市黄浦区南京东路123号', '上海', '上海市', 5, 2018, '["wifi", "parking", "gym", "pool", "restaurant", "spa"]', 'approved', '021-12345678', 'reservation@bundhotel.com'),
        (2, '北京王府井酒店', 'Beijing Wangfujing Hotel', '北京市东城区王府井大街456号', '北京', '北京市', 4, 2019, '["wifi", "breakfast", "concierge", "laundry"]', 'approved', '010-87654321', 'info@wangfujinghotel.com')
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;`,
        
        `INSERT INTO room_types (hotel_id, name, description, area, max_guests, bed_type, facilities, base_price, discount_rate, available_count) VALUES
        (1, '豪华大床房', '45平米江景大床房，含双早，免费wifi', 45.00, 2, '大床', '["wifi", "tv", "minibar", "bathrobe"]', 899.00, 0.90, 5),
        (1, '行政套房', '68平米行政楼层套房，江景，行政酒廊待遇', 68.00, 2, '大床', '["wifi", "tv", "minibar", "jacuzzi", "executive_lounge"]', 1599.00, 0.85, 3),
        (1, '标准双床房', '32平米标准双床房，城市景观', 32.00, 2, '双床', '["wifi", "tv", "hairdryer"]', 599.00, 1.00, 10),
        (2, '商务大床房', '38平米商务大床房，办公桌，免费wifi', 38.00, 2, '大床', '["wifi", "tv", "desk", "coffee_maker"]', 699.00, 0.95, 8),
        (2, '家庭套房', '55平米家庭套房，可住4人，儿童友好', 55.00, 4, '一大一小', '["wifi", "tv", "kitchenette", "crib"]', 1299.00, 0.88, 4)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;`,
        
        `INSERT INTO hotel_images (hotel_id, url, alt_text, is_main, \`order\`) VALUES
        (1, 'https://example.com/hotel1-1.jpg', '上海外滩大酒店外观', true, 1),
        (1, 'https://example.com/hotel1-2.jpg', '豪华大床房', false, 2),
        (1, 'https://example.com/hotel1-3.jpg', '酒店大堂', false, 3),
        (2, 'https://example.com/hotel2-1.jpg', '北京王府井酒店外观', true, 1),
        (2, 'https://example.com/hotel2-2.jpg', '商务大床房', false, 2)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;`
      ];
      
      console.log('🌱 开始插入测试数据...');
      
      for (let i = 0; i < seedData.length; i++) {
        await this.connection.query(seedData[i]);
        console.log(`✅ 数据插入成功 (${i + 1}/${seedData.length})`);
      }
      
      console.log('🎉 测试数据插入完成！');
    } catch (error) {
      console.error('❌ 数据插入失败:', error.message);
      throw error;
    }
  }
//将当前数据库导出为 SQL 文件
  async backupDatabase() {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 生成时间戳作为备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
    const mysqldump = require('mysqldump');
    // 使用 mysqldump 工具备份数据库
    await mysqldump({
      connection: {
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
      },
      dumpToFile: backupFile,
    });
    
    console.log(`💾 数据库备份已保存到: ${backupFile}`);
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 命令行接口
async function main() {
  const manager = new DatabaseManager();
  const command = process.argv[2];
  
  try {
    // 根据命令决定连接方式
    switch (command) {
      case 'init':
        // init命令不需要连接到具体数据库，因为可能要先创建数据库
        await manager.connect(false);
        break;
      case 'seed':
      case 'backup':
        // seed和backup命令需要连接到具体数据库
        await manager.connect(true);
        break;
      case 'reset':
        // reset命令先不连接数据库，因为要先删除数据库
        await manager.connect(false);
        break;
      default:
        await manager.connect(true);
    }
    
    switch (command) {
      case 'init':
        await manager.initDatabase();
        break;
      case 'seed':
        await manager.seedDatabase();
        break;
      case 'backup':
        await manager.backupDatabase();
        break;
      case 'reset':
        console.log('⚠️  正在重置数据库...');
        await manager.connection.query(`DROP DATABASE IF EXISTS ${manager.config.database}`);
        console.log('🗑️  数据库已删除');
        await manager.initDatabase();
        await manager.seedDatabase();
        console.log('🔄 数据库重置完成');
        break;
      default:
        console.log(`
数据库管理工具

用法: node scripts/db-init.js [command]

命令:
  init     初始化数据库结构
  seed     插入测试数据
  backup   备份数据库
  reset    重置数据库（删除并重新创建）

示例:
  node scripts/db-init.js init   # 初始化数据库
  node scripts/db-init.js seed   # 插入测试数据
  node scripts/db-init.js reset  # 重置整个数据库
        `);
    }
  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    process.exit(1);
  } finally {
    await manager.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseManager;