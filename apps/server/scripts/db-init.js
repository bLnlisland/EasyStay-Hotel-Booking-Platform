const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// ✅ 导入多环境配置（必须位于 src/config/config.js）
const config = require('../src/config/config');

class DatabaseManager {
  constructor() {
    // 1. 获取并清理环境变量（移除可能的空格/换行）
    const rawEnv = process.env.NODE_ENV || 'development';
    const env = rawEnv.trim();

    // 2. 兼容 config 是对象或函数的情况
    let envConfig;
    if (typeof config === 'function') {
      envConfig = config(env);
    } else {
      envConfig = config[env];
    }

    // 3. 如果依然获取不到配置，抛出明确错误
    if (!envConfig) {
      const availableEnvs = Object.keys(config).join(', ');
      throw new Error(
        `❌ 找不到环境配置: "${env}"\n` +
        `   可用环境: ${availableEnvs}\n` +
        `   请检查 NODE_ENV 环境变量是否正确设置。`
      );
    }

    // 4. 将 Sequelize 风格的配置字段映射为 mysql2 风格
    this.dbConfig = {
      host: envConfig.host,
      port: envConfig.port,
      user: envConfig.username,
      password: envConfig.password,
      database: envConfig.database
    };

    this.env = env;
    console.log(`🌍 当前环境: ${this.env}, 目标数据库: ${this.dbConfig.database}`);
  }

  /**
   * 连接 MySQL 服务器
   * @param {boolean} useDatabase - 是否连接到具体数据库
   */
  async connect(useDatabase = false) {
    const connectionConfig = {
      host: this.dbConfig.host,
      port: this.dbConfig.port,
      user: this.dbConfig.user,
      password: this.dbConfig.password
    };

    if (useDatabase && this.dbConfig.database) {
      connectionConfig.database = this.dbConfig.database;
    }

    this.connection = await mysql.createConnection(connectionConfig);

    if (useDatabase && this.dbConfig.database) {
      console.log(`✅ 已连接到MySQL (${this.env}) 数据库: ${this.dbConfig.database}`);
    } else {
      console.log(`✅ 已连接到MySQL服务器 (${this.env})`);
    }
  }

  /**
   * 过滤 init.sql 中的数据库管理语句（DROP/CREATE/USE）
   */
  filterDatabaseStatements(sqlContent) {
    return sqlContent
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        // 跳过 DROP DATABASE / CREATE DATABASE / USE 语句（包括注释掉的）
        if (trimmed.match(/^(DROP|CREATE)\s+DATABASE\s+/i)) return false;
        if (trimmed.match(/^USE\s+`?[\w_]+`?;?/i)) return false;
        if (trimmed.match(/^--\s*(DROP|CREATE)\s+DATABASE/i)) return false;
        if (trimmed.match(/^--\s*USE\s+/i)) return false;
        return true;
      })
      .join('\n');
  }

  /**
   * 解析 SQL 语句（智能分号处理）
   */
  parseSQLStatements(sqlContent) {
    const statements = [];
    let currentStatement = '';
    let inComment = false;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < sqlContent.length; i++) {
      const char = sqlContent[i];
      const nextChar = i < sqlContent.length - 1 ? sqlContent[i + 1] : '';

      // 单行注释
      if (!inString && !inComment && char === '-' && nextChar === '-') {
        inComment = true;
        i++;
        continue;
      }
      if (!inString && inComment && char === '\n') {
        inComment = false;
        continue;
      }

      // 多行注释
      if (!inString && !inComment && char === '/' && nextChar === '*') {
        inComment = true;
        i++;
        continue;
      }
      if (!inString && inComment && char === '*' && nextChar === '/') {
        inComment = false;
        i++;
        continue;
      }

      if (inComment) continue;

      // 字符串引号处理
      if (!inString && (char === "'" || char === '"' || char === '`')) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && sqlContent[i - 1] !== '\\') {
        inString = false;
      }

      currentStatement += char;

      // 语句结束（分号且不在字符串内）
      if (char === ';' && !inString) {
        const trimmed = currentStatement.trim();
        if (trimmed) statements.push(trimmed);
        currentStatement = '';
      }
    }

    const last = currentStatement.trim();
    if (last) statements.push(last);

    // 过滤纯注释或空语句
    const filtered = statements.filter(stmt => {
      const clean = stmt.replace(/--.*$/gm, '').trim();
      return clean && !clean.startsWith('/*');
    });

    console.log(`🔍 解析完成，有效SQL语句: ${filtered.length} 条`);
    return filtered;
  }

  /**
   * 初始化数据库结构
   */
  async initDatabase() {
    try {
      // 1. 创建数据库（如果不存在）
      await this.connection.query(
        `CREATE DATABASE IF NOT EXISTS \`${this.dbConfig.database}\` 
         CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      console.log(`📁 数据库 \`${this.dbConfig.database}\` 已确认存在`);

      // 2. 切换到该数据库
      await this.connection.query(`USE \`${this.dbConfig.database}\`;`);
      console.log(`📁 已切换到数据库: ${this.dbConfig.database}`);

      // 🟢 修复：增强 init.sql 文件读取错误提示
      const sqlPath = path.join(__dirname, '../migrations/init.sql');
      let sqlContent;
      try {
        sqlContent = fs.readFileSync(sqlPath, 'utf8');
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.error(`❌ 找不到 init.sql 文件！`);
          console.error(`   期望路径: ${sqlPath}`);
          console.error(`💡 请确保该文件存在，或重新创建:`);
          console.error(`   1. 确认项目目录下有 backups/migrations/ 文件夹`);
          console.error(`   2. 将 init.sql 文件放置在此目录下`);
          console.error(`   3. 你可以从以下位置获取 init.sql 模板:`);
          console.error(`      - 项目备份文件`);
          console.error(`      - 本次对话历史记录`);
          throw new Error('缺少 init.sql 文件');
        }
        throw err;
      }

      const filteredContent = this.filterDatabaseStatements(sqlContent);
      const statements = this.parseSQLStatements(filteredContent);

      console.log(`📝 开始执行 ${statements.length} 条SQL语句...`);
      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          const preview = stmt.split('\n')[0].slice(0, 50);
          console.log(`执行中 (${i + 1}/${statements.length}): ${preview}...`);
          await this.connection.query(stmt);
          console.log(`✅ 执行成功 (${i + 1}/${statements.length})`);
        } catch (err) {
          console.error(`❌ 语句执行失败: ${err.message}`);
          console.error(`语句预览: ${stmt.slice(0, 100)}...`);
          throw err;
        }
      }

      console.log('🎉 数据库初始化完成！');
    } catch (error) {
      console.error('❌ 初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 插入测试数据（管理员/商户/普通用户，管理员也可在注册页自助注册）
   */
  async seedDatabase() {
    try {
      if (!this.connection.config.database || this.connection.config.database !== this.dbConfig.database) {
        await this.connection.query(`USE \`${this.dbConfig.database}\`;`);
      }

      const bcrypt = require('bcryptjs');
      const adminPwd = await bcrypt.hash('admin123', 10);
      const merchantPwd = await bcrypt.hash('merchant123', 10);
      const userPwd = await bcrypt.hash('user123', 10);

      // 删除已存在的 superadmin 用户（种子库只保留普通管理员，不再含 superadmin）
      await this.connection.query("DELETE FROM users WHERE role = 'superadmin'");
      console.log('🗑️ 已清理 superadmin 用户（如有）');

      const seeds = [
        // 管理员/商户/普通用户（管理员也可通过 /register 页自助注册）
        `INSERT INTO users (username, email, password, role, approval_status, full_name, phone, avatar, is_active) VALUES
         ('admin', 'admin@hotel.com', '${adminPwd}', 'admin', 'approved', '系统管理员', '13800138001', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/icons/person-circle.svg', true),
         ('merchant1', 'merchant@hotel.com', '${merchantPwd}', 'merchant', 'approved', '酒店商户', '13800138002', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/icons/person-circle.svg', true),
         ('user1', 'user@example.com', '${userPwd}', 'user', 'approved', '普通用户', '13800138003', 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/icons/person-circle.svg', true)
         ON DUPLICATE KEY UPDATE password = VALUES(password), full_name = VALUES(full_name), phone = VALUES(phone), updated_at = CURRENT_TIMESTAMP;`,

        `INSERT INTO hotels (merchant_id, name_zh, name_en, address, city, province, star_rating, opening_year, facilities, status, contact_phone, contact_email) VALUES
         (3, '上海外滩大酒店', 'Shanghai Bund Hotel', '上海市黄浦区南京东路123号', '上海', '上海市', 5, 2018, '["wifi", "parking", "gym", "pool", "restaurant", "spa"]', 'approved', '021-12345678', 'reservation@bundhotel.com'),
         (3, '北京王府井酒店', 'Beijing Wangfujing Hotel', '北京市东城区王府井大街456号', '北京', '北京市', 4, 2019, '["wifi", "breakfast", "concierge", "laundry"]', 'approved', '010-87654321', 'info@wangfujinghotel.com')
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
      for (let i = 0; i < seeds.length; i++) {
        await this.connection.query(seeds[i]);
        console.log(`✅ 数据插入成功 (${i + 1}/${seeds.length})`);
      }
      console.log('🎉 测试数据插入完成！');
    } catch (error) {
      console.error('❌ 数据插入失败:', error.message);
      throw error;
    }
  }

  /**
   * 备份数据库
   */
  async backupDatabase() {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `${this.dbConfig.database}-${timestamp}.sql`);

    const mysqldump = require('mysqldump');
    await mysqldump({
      connection: {
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        user: this.dbConfig.user,
        password: this.dbConfig.password,
        database: this.dbConfig.database
      },
      dumpToFile: backupFile
    });

    console.log(`💾 数据库备份已保存: ${backupFile} (环境: ${this.env})`);
  }

  /**
   * 关闭连接
   */
  async close() {
    if (this.connection) {
      await this.connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

/**
 * 命令行入口
 */
async function main() {
  const manager = new DatabaseManager();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'init':
        await manager.connect(false);
        await manager.initDatabase();
        break;
      case 'seed':
        await manager.connect(true);
        await manager.seedDatabase();
        break;
      case 'backup':
        await manager.connect(true);
        await manager.backupDatabase();
        break;
      case 'reset':
        console.log(`⚠️  重置数据库: ${manager.dbConfig.database} (环境: ${manager.env})`);
        await manager.connect(false);
        await manager.connection.query(`DROP DATABASE IF EXISTS \`${manager.dbConfig.database}\`;`);
        console.log(`🗑️  数据库已删除`);
        await manager.initDatabase();
        await manager.seedDatabase();
        console.log('🔄 数据库重置完成');
        break;
      default:
        console.log(`
📌 数据库管理工具（环境感知版）

用法: NODE_ENV=[环境] node scripts/db-init.js [命令]

环境变量 NODE_ENV: development (默认), test, production

命令:
  init     初始化数据库结构（自动创建库+表）
  seed     插入测试数据（管理员/商户/用户）
  backup   备份当前环境数据库
  reset    重置数据库（删除→重建→种子）

示例:
  NODE_ENV=test node scripts/db-init.js init
  NODE_ENV=production node scripts/db-init.js backup
        `);
    }
  } catch (err) {
    console.error('❌ 操作失败:', err.message);
    process.exit(1);
  } finally {
    await manager.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = DatabaseManager;