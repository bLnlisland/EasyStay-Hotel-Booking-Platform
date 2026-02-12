// scripts/db-full-test.js
/**
 * 数据库完整测试脚本（最终修复版）
 * 运行方式: NODE_ENV=test node scripts/db-full-test.js
 * 特点: 自动检测 MySQL 版本，兼容 5.7；修复触发器测试字段名
 */
require('dotenv').config();
const assert = require('assert').strict;
const { sequelize, testConnection } = require('../src/config/database');
const {
  User,
  Hotel,
  RoomType,
  Booking,
  AuditLog,
  HotelImage
} = require('../src/models');

// ========== 颜色输出 ==========
const color = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

let totalTests = 0;
let passedTests = 0;
let skippedTests = 0;

function assertEqual(actual, expected, message) {
  totalTests++;
  try {
    assert.strictEqual(actual, expected);
    console.log(`  ${color.green}✓${color.reset} ${message}`);
    passedTests++;
  } catch (err) {
    console.error(`  ${color.red}✗ ${message}${color.reset}`);
    console.error(`    Expected: ${expected}, Actual: ${actual}`);
  }
}

function assertOk(value, message) {
  totalTests++;
  if (value) {
    console.log(`  ${color.green}✓${color.reset} ${message}`);
    passedTests++;
  } else {
    console.error(`  ${color.red}✗ ${message}${color.reset}`);
    console.error(`    Value: ${value}`);
  }
}

function skip(message) {
  totalTests++;
  skippedTests++;
  console.log(`  ${color.yellow}⚠ 跳过${color.reset} ${message}`);
}

// ========== 主测试函数 ==========
(async () => {
  console.log(`\n${color.cyan}═══════════════════════════════════════════════${color.reset}`);
  console.log(`${color.cyan}         数据库完整测试脚本启动                ${color.reset}`);
  console.log(`${color.cyan}═══════════════════════════════════════════════${color.reset}\n`);

  // 环境检查
  const env = (process.env.NODE_ENV || '').trim();
  if (env !== 'test') {
    console.error(`${color.red}❌ 错误: 此脚本只能在 test 环境下运行！${color.reset}`);
    console.error(`  当前 NODE_ENV = ${process.env.NODE_ENV || '未设置'} (清理后: ${env})`);
    process.exit(1);
  }
  console.log(`${color.green}✓${color.reset} 环境检查通过 (NODE_ENV=test)\n`);

  // 测试数据库连接
  console.log(`📡 测试数据库连接...`);
  const isConnected = await testConnection();
  assertOk(isConnected, '数据库连接成功');
  if (!isConnected) process.exit(1);

  // 验证当前数据库是否为 test 库
  const dbConfig = require('../src/config/config')[env];
  const [dbRes] = await sequelize.query('SELECT DATABASE() as dbname');
  const currentDb = dbRes[0].dbname;
  assertEqual(currentDb, dbConfig.database, `当前数据库应为 ${dbConfig.database}`);

  // 🔍 获取 MySQL 版本，用于兼容性判断
  const [versionRes] = await sequelize.query('SELECT VERSION() as version');
  const mysqlVersion = versionRes[0].version;
  const isMySQL8 = mysqlVersion[0] >= '8'; // 8.0.16 以上才支持 CHECK 约束
  console.log(`\n📌 MySQL 版本: ${mysqlVersion} ${!isMySQL8 ? '(CHECK 约束测试将跳过)' : ''}\n`);

  // ========== 事务开始 ==========
  const transaction = await sequelize.transaction();
  try {
    console.log(`${color.cyan}---------- 开始测试用例 (事务已开启，结束后回滚) ----------${color.reset}\n`);

    // ----- 表存在性 -----
    console.log(`📋 验证核心表是否存在...`);
    const tables = ['users', 'hotels', 'room_types', 'hotel_images', 'bookings', 'audit_logs'];
    for (const tbl of tables) {
      const [result] = await sequelize.query(`SHOW TABLES LIKE '${tbl}'`, { transaction });
      assertOk(result.length > 0, `表 ${tbl} 存在`);
    }

    // ----- 唯一约束 -----
    console.log(`\n🔐 验证唯一约束...`);
    const testUser = await User.create({
      username: 'test_unique',
      email: 'unique@test.com',
      password: 'hashed',
      role: 'user'
    }, { transaction });
    try {
      await User.create({
        username: 'test_unique2',
        email: 'unique@test.com',
        password: 'hashed'
      }, { transaction });
      assertOk(false, '重复邮箱应抛出唯一约束错误');
    } catch (err) {
      assertOk(err.name.includes('SequelizeUniqueConstraintError') || err.code === 'ER_DUP_ENTRY', '重复邮箱触发唯一约束');
    }

    // ----- 非空约束 -----
    console.log(`\n🚫 验证非空约束...`);
    try {
      await Hotel.create({
        merchant_id: testUser.id,
        name_zh: null,
        address: 'test',
        city: 'test'
      }, { transaction });
      assertOk(false, 'name_zh 为 null 应抛出非空错误');
    } catch (err) {
      assertOk(err.name.includes('SequelizeValidationError') || err.name.includes('SequelizeDatabaseError'), '非空约束生效');
    }

    // ----- CHECK 约束（版本自适应）-----
    console.log(`\n⭐ 验证 CHECK 约束...`);
    if (isMySQL8) {
      try {
        await Hotel.create({
          merchant_id: testUser.id,
          name_zh: '测试酒店',
          address: 'addr',
          city: 'city',
          star_rating: 6
        }, { transaction });
        assertOk(false, '星级超出范围应被拒绝');
      } catch (err) {
        assertOk(err.message.includes('constraint') || err.message.includes('check'), '星级超出范围应被拒绝');
      }
    } else {
      skip('MySQL 版本低于 8.0.16，CHECK 约束无效，跳过测试');
    }

    // ----- 触发器测试（修复字段名）-----
    console.log(`\n⚡ 验证 booking_reference 触发器...`);
    const testHotel = await Hotel.create({
      merchant_id: testUser.id,
      name_zh: '触发器酒店',
      address: 'addr',
      city: 'city',
      status: 'approved'
    }, { transaction });
    const testRoom = await RoomType.create({
      hotel_id: testHotel.id,
      name: '标准间',
      base_price: 300,
      available_count: 5
    }, { transaction });

    // 不指定 bookingReference，触发器自动生成
    const booking1 = await Booking.create({
      user_id: testUser.id,
      hotel_id: testHotel.id,
      room_type_id: testRoom.id,
      check_in_date: '2026-03-01',
      check_out_date: '2026-03-03',
      adults: 2,
      rooms: 1,
      total_price: 600
    }, { transaction });
    assertOk(booking1.bookingReference && booking1.bookingReference.startsWith('BK'), 'booking_reference 自动生成并符合 BK 前缀');
    console.log(`   生成参考号: ${color.dim}${booking1.bookingReference}${color.reset}`);

    // 🟢 修复：使用 bookingReference（驼峰）而非 booking_reference（下划线）
    const booking2 = await Booking.create({
      user_id: testUser.id,
      hotel_id: testHotel.id,
      room_type_id: testRoom.id,
      check_in_date: '2026-03-05',
      check_out_date: '2026-03-07',
      adults: 2,
      rooms: 1,
      total_price: 600,
      bookingReference: 'MANUAL-123'   // ✅ 正确属性名
    }, { transaction });
    assertEqual(booking2.bookingReference, 'MANUAL-123', '触发器不应覆盖手动指定的 booking_reference');

    // ----- JSON 字段 -----
    console.log(`\n📦 验证 JSON 字段...`);
    const hotelWithFacilities = await Hotel.create({
      merchant_id: testUser.id,
      name_zh: 'JSON测试酒店',
      address: 'addr',
      city: 'city',
      facilities: ['WiFi', '停车场', '游泳池']
    }, { transaction });
    const fetchedHotel = await Hotel.findByPk(hotelWithFacilities.id, { transaction });
    assertOk(Array.isArray(fetchedHotel.facilities), 'facilities 应解析为数组');
    assertEqual(fetchedHotel.facilities.length, 3, 'JSON 数组长度正确');
    assertEqual(fetchedHotel.facilities[0], 'WiFi', 'JSON 内容正确');

    // ----- 外键级联删除 -----
    console.log(`\n🔗 验证外键级联删除...`);
    const cascadeHotel = await Hotel.create({
      merchant_id: testUser.id,
      name_zh: '级联测试酒店',
      address: 'addr',
      city: 'city'
    }, { transaction });
    const cascadeRoom = await RoomType.create({
      hotel_id: cascadeHotel.id,
      name: '将被级联删除',
      base_price: 200,
      available_count: 2
    }, { transaction });
    const roomId = cascadeRoom.id;
    await cascadeHotel.destroy({ transaction });
    const deletedRoom = await RoomType.findByPk(roomId, { transaction });
    assertEqual(deletedRoom, null, '删除酒店后，关联房型应自动删除');

    // ----- 模型关联查询 -----
    console.log(`\n🔍 验证 Sequelize 关联...`);
    const assocHotel = await Hotel.create({
      merchant_id: testUser.id,
      name_zh: '关联酒店',
      address: 'addr',
      city: 'city'
    }, { transaction });
    await RoomType.create({
      hotel_id: assocHotel.id,
      name: '关联房型A',
      base_price: 100
    }, { transaction });
    await RoomType.create({
      hotel_id: assocHotel.id,
      name: '关联房型B',
      base_price: 200
    }, { transaction });
    const hotelWithRooms = await Hotel.findByPk(assocHotel.id, {
      include: { model: RoomType, as: 'room_types' },
      transaction
    });
    assertOk(hotelWithRooms.room_types, '酒店包含房型关联');
    assertEqual(hotelWithRooms.room_types.length, 2, '酒店下应有 2 个房型');

    // ----- 事务回滚 -----
    console.log(`\n🔄 验证事务回滚...`);
    const t = await sequelize.transaction();
    try {
      await Hotel.create({
        merchant_id: testUser.id,
        name_zh: '回滚酒店',
        address: 'addr',
        city: 'city'
      }, { transaction: t });
      throw new Error('手动触发回滚');
    } catch {
      await t.rollback();
      const found = await Hotel.findOne({ where: { name_zh: '回滚酒店' } });
      assertEqual(found, null, '事务回滚后不应存在新插入数据');
    }

    // ----- 并发模拟（简化）-----
    console.log(`\n⚡ 验证并发预订库存安全 (模拟)...`);
    const concurrencyHotel = await Hotel.create({
      merchant_id: testUser.id,
      name_zh: '并发酒店',
      address: 'addr',
      city: 'city'
    }, { transaction });
    const concurrencyRoom = await RoomType.create({
      hotel_id: concurrencyHotel.id,
      name: '热门房型',
      base_price: 500,
      available_count: 3
    }, { transaction });

    const bookingPromises = [];
    for (let i = 0; i < 4; i++) {
      bookingPromises.push(
        (async () => {
          try {
            await Booking.create({
              user_id: testUser.id,
              hotel_id: concurrencyHotel.id,
              room_type_id: concurrencyRoom.id,
              check_in_date: '2026-04-01',
              check_out_date: '2026-04-03',
              adults: 2,
              rooms: 1,
              total_price: 1000
            }, { transaction });
          } catch {
            // 模拟库存不足
          }
        })()
      );
    }
    await Promise.all(bookingPromises);
    const bookingsCount = await Booking.count({
      where: {
        room_type_id: concurrencyRoom.id,
        check_in_date: '2026-04-01'
      },
      transaction
    });
    console.log(`   并发预订后预订数量: ${bookingsCount} (应由业务逻辑控制库存)`);

    // ----- 审核日志 -----
    console.log(`\n📝 验证审核日志...`);
    const adminUser = await User.findOne({ where: { role: 'admin' }, transaction });
    if (adminUser) {
      const log = await AuditLog.create({
        hotel_id: testHotel.id,
        admin_id: adminUser.id,
        action: 'approve',
        old_status: 'pending',
        new_status: 'approved'
      }, { transaction });
      assertOk(log.id, '审核日志创建成功');
    } else {
      console.log(`   ${color.yellow}⚠ 未找到 admin 用户，跳过审核日志测试${color.reset}`);
    }

    // ----- 默认值测试 -----
    console.log(`\n🔧 验证字段默认值...`);
    const defaultHotel = await Hotel.create({
      merchant_id: testUser.id,
      name_zh: '默认值酒店',
      address: 'addr',
      city: 'city'
    }, { transaction });
    assertEqual(defaultHotel.status, 'draft', '酒店 status 默认值应为 draft');
    assertEqual(defaultHotel.check_in_time, '14:00', '默认 check_in_time 为 14:00');
    assertEqual(defaultHotel.check_out_time, '12:00', '默认 check_out_time 为 12:00');

    // ----- 测试完成 -----
    console.log(`\n${color.cyan}---------- 测试用例执行完毕 ----------${color.reset}`);
    await transaction.rollback();
    console.log(`\n${color.dim}↩️ 事务已回滚，测试数据已清除${color.reset}\n`);

  } catch (error) {
    console.error(`${color.red}❌ 测试过程发生未预期错误:${color.reset}`, error);
    await transaction.rollback();
    process.exit(1);
  }

  // ========== 测试总结 ==========
  console.log(`${color.cyan}═══════════════════════════════════════════════${color.reset}`);
  console.log(`测试结果: ${color.green}${passedTests} 通过${color.reset} / ${totalTests - passedTests - skippedTests} 失败 / ${skippedTests} 跳过 / 总计 ${totalTests}`);
  if (passedTests + skippedTests === totalTests) {
    console.log(`${color.green}✅ 所有数据库测试均通过！${color.reset}`);
  } else {
    console.log(`${color.red}❌ 部分测试失败，请检查日志${color.reset}`);
    process.exit(1);
  }
  console.log(`${color.cyan}═══════════════════════════════════════════════${color.reset}\n`);

  await sequelize.close();
  process.exit(0);
})();