const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
class Hotel extends Model {}

Hotel.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_zh: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200],
    },
  },
  name_en: {
    type: DataTypes.STRING(200),
  },
  description: {
    type: DataTypes.TEXT,
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  province: {
    type: DataTypes.STRING(50),
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
  },
  star_rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
    defaultValue: 3,
  },
  opening_year: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1900,
      max: new Date().getFullYear(),
    },
  },
  facilities: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('draft', 'under_review', 'approved', 'rejected', 'offline'),
    defaultValue: 'draft',
    allowNull: false,
  },
  rejection_reason: {
    type: DataTypes.TEXT,
  },
  contact_phone: {
    type: DataTypes.STRING(20),
  },
  contact_email: {
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true,
    },
  },
  check_in_time: {
    type: DataTypes.STRING(10),
    defaultValue: '14:00',
  },
  check_out_time: {
    type: DataTypes.STRING(10),
    defaultValue: '12:00',
  },
  policy: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'Hotel',
  tableName: 'hotels',
  indexes: [
    { fields: ['city'] },
    { fields: ['star_rating'] },
    { fields: ['status'] },
  ],
});

// 关联关系
Hotel.associate = (models) => {
  Hotel.belongsTo(models.User, { foreignKey: 'merchant_id', as: 'merchant' });
  Hotel.hasMany(models.RoomType, { foreignKey: 'hotel_id', as: 'room_types' });
  Hotel.hasMany(models.HotelImage, { foreignKey: 'hotel_id', as: 'images' });
  Hotel.hasMany(models.HotelTag, { foreignKey: 'hotel_id', as: 'tags' });
  Hotel.hasMany(models.Booking, { foreignKey: 'hotel_id', as: 'bookings' });
  Hotel.hasMany(models.AuditLog, { foreignKey: 'hotel_id', as: 'audit_logs' });
};

// 类方法：根据状态获取酒店
Hotel.getByStatus = async function(status) {
  return await this.findAll({
    where: { status },
    include: [
      { model: sequelize.models.HotelImage, as: 'images', limit: 1 },
      { model: sequelize.models.RoomType, as: 'room_types', limit: 3 },
    ],
  });
};

module.exports = Hotel;
