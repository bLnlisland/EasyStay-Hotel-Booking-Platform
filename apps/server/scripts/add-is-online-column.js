/**
 * 为 hotels 表添加 is_online 列（审核与上下线分离所需）
 * 若列已存在则跳过。执行一次即可。
 * 用法：在 apps/server 目录下执行 node scripts/add-is-online-column.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../src/models');
const sequelize = db.sequelize;

async function main() {
  try {
    const dialect = sequelize.getDialect();
    if (dialect !== 'mysql' && dialect !== 'mariadb') {
      console.log('当前仅支持 MySQL/MariaDB，跳过。');
      process.exit(0);
    }
    const table = 'hotels';
    const [rows] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = 'is_online'`,
      { replacements: [table] }
    );
    if (rows && rows.length > 0) {
      console.log('✅ hotels.is_online 列已存在，无需执行。');
      process.exit(0);
    }
    await sequelize.query(
      `ALTER TABLE \`${table}\` ADD COLUMN \`is_online\` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '发布状态：1=已上线，0=已下线'`
    );
    console.log('✅ 已为 hotels 表添加 is_online 列。');
  } catch (e) {
    console.error('执行失败:', e.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
