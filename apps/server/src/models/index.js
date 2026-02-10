// models/index.js
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const Sequelize = require('sequelize');

const db = {};

// 第一步：加载所有模型
console.log('第一步：加载模型...');
const modelFiles = fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file.slice(-3) === '.js' &&
      file !== 'test-models.js'
    );
  });

modelFiles.forEach(file => {
  try {
    console.log(`  加载: ${file}`);
    const ModelClass = require(path.join(__dirname, file));
    
    if (ModelClass && ModelClass.name) {
      db[ModelClass.name] = ModelClass;
      console.log(`  ✅ ${ModelClass.name}`);
    }
  } catch (error) {
    console.error(`  ❌ ${file}: ${error.message}`);
  }
});

console.log('\n✅ 模型加载完成:', Object.keys(db));

// 第二步：简单验证模型
console.log('\n第二步：验证模型基本信息...');
Object.keys(db).forEach(modelName => {
  const model = db[modelName];
  console.log(`  ${modelName}:`, {
    type: typeof model,
    isClass: typeof model === 'function',
    hasAssociate: typeof model.associate === 'function',
    hasInit: typeof model.init === 'function'
  });
});

// 第三步：设置关联（不需要复杂的检查）
console.log('\n第三步：设置关联...');
let associationErrors = 0;

Object.keys(db).forEach(modelName => {
  const model = db[modelName];
  
  // 检查是否有 associate 方法
  if (typeof model.associate === 'function') {
    try {
      console.log(`  设置 ${modelName} 的关联...`);
      model.associate(db);
      console.log(`  ✅ ${modelName} 关联设置成功`);
    } catch (error) {
      associationErrors++;
      console.error(`  ❌ ${modelName} 关联设置失败: ${error.message}`);
      console.error(`    错误详情: ${error.stack.split('\n')[0]}`);
    }
  }
});

if (associationErrors > 0) {
  console.warn(`\n⚠️  警告: ${associationErrors} 个模型关联设置失败`);
}

// 第四步：特殊处理 - 重新验证某些重要关联
console.log('\n第四步：验证关键关联...');
const criticalAssociations = [
  { from: 'Hotel', to: 'User', type: 'belongsTo', as: 'merchant' },
  { from: 'Hotel', to: 'RoomType', type: 'hasMany', as: 'room_types' },
  { from: 'Hotel', to: 'HotelImage', type: 'hasMany', as: 'images' },
  { from: 'User', to: 'Hotel', type: 'hasMany', as: 'hotels' }
];

criticalAssociations.forEach(assoc => {
  try {
    const fromModel = db[assoc.from];
    const toModel = db[assoc.to];
    
    if (fromModel && toModel) {
      console.log(`  ✅ ${assoc.from} -> ${assoc.to} (${assoc.as})`);
    } else {
      console.warn(`  ⚠️  缺少模型: ${assoc.from} 或 ${assoc.to}`);
    }
  } catch (error) {
    console.error(`  ❌ ${assoc.from} -> ${assoc.to}: ${error.message}`);
  }
});

// 添加 sequelize 实例
db.sequelize = sequelize;
db.Sequelize = Sequelize;

console.log('\n🎉 模型加载完成!');
console.log('导出以下模型:', Object.keys(db));

module.exports = db;