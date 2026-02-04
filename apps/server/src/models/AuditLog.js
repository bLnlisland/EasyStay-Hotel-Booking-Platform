const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class AuditLog extends Model {}

AuditLog.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('approve', 'reject', 'suspend', 'activate'),
    allowNull: false,
  },
  reason: {
    type: DataTypes.TEXT,
  },
  old_status: {
    type: DataTypes.STRING(50),
  },
  new_status: {
    type: DataTypes.STRING(50),
  },
  ip_address: {
    type: DataTypes.STRING(45),
  },
  user_agent: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'AuditLog',
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'hotel' });
  AuditLog.belongsTo(models.User, { foreignKey: 'admin_id', as: 'admin' });
};

module.exports = AuditLog;