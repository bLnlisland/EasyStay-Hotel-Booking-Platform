const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

const db = {};

// 读取所有模型文件
fs.readdirSync(__dirname)
  .filter(file => file.indexOf('.') !== 0 && file !== path.basename(__filename) && file.slice(-3) === '.js')
  .forEach(file => {
    const model = new (require(path.join(__dirname, file)))(sequelize);
    db[model.name] = model;
  });

// 设置模型关联
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 添加 sequelize 实例
db.sequelize = sequelize;
db.Sequelize = require('sequelize');

// 导出所有模型
module.exports = db;
