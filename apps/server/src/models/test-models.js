// test-models.js
const db = require('./models');

console.log('=== 模型加载测试 ===');
console.log('导出的键:', Object.keys(db));
console.log('User模型:', db.User ? '✅ 已找到' : '❌ 未找到');
console.log('Hotel模型:', db.Hotel ? '✅ 已找到' : '❌ 未找到');
console.log('RoomType模型:', db.RoomType ? '✅ 已找到' : '❌ 未找到');
console.log('HotelImage模型:', db.HotelImage ? '✅ 已找到' : '❌ 未找到');
console.log('sequelize实例:', db.sequelize ? '✅ 已找到' : '❌ 未找到');

// 测试数据库连接
async function testConnection() {
  try {
    await db.sequelize.authenticate();
    console.log('数据库连接: ✅ 成功');
  } catch (error) {
    console.log('数据库连接: ❌ 失败', error.message);
  }
}

// 测试模型查询
async function testQueries() {
  try {
    const users = await db.User.findAll({ limit: 1 });
    console.log('User查询: ✅ 成功 (找到', users.length, '个用户)');
  } catch (error) {
    console.log('User查询: ❌ 失败', error.message);
  }
  
  try {
    const hotels = await db.Hotel.findAll({ limit: 1 });
    console.log('Hotel查询: ✅ 成功 (找到', hotels.length, '个酒店)');
  } catch (error) {
    console.log('Hotel查询: ❌ 失败', error.message);
  }
}

async function runTests() {
  console.log('\n=== 运行测试 ===');
  await testConnection();
  await testQueries();
  console.log('=== 测试完成 ===');
  process.exit(0);
}

runTests();