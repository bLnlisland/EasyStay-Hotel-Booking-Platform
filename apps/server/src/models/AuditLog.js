const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
// 定义 AuditLog 模型（审计日志模型）
class AuditLog extends Model {}

AuditLog.init({
  id: {   //日志ID，自增主键
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  hotel_id: {   //关联的酒店ID
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  admin_id: {   //管理员ID
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {  // 操作类型，枚举值（approve, reject, suspend, activate），不能为空
    type: DataTypes.ENUM('approve', 'reject', 'suspend', 'activate'),
    allowNull: false,
  },
  reason: {   // 操作原因，可以为空
    type: DataTypes.TEXT,
  },
  old_status: {   // 旧状态，可以为空
    type: DataTypes.STRING(50),
  },
  new_status: {    // 新状态，可以为空
    type: DataTypes.STRING(50),
  },
  ip_address: {   // 操作的 IP 地址，可以为空
    type: DataTypes.STRING(45),
  },
  user_agent: {   // 用户代理字符串（通常包含浏览器信息），可以为空
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  timestamps: true,   //启用时间戳
  createdAt: 'created_at',
  updatedAt: false,   //禁止更新的时间戳字段
});

AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'hotel' }); // 每个审计日志属于一个酒店
  AuditLog.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' }); // 每个审计日志属于一个管理员
};

module.exports = AuditLog;