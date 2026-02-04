const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
class RoomType extends Model {}

RoomType.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  area: {
    type: DataTypes.DECIMAL(6, 2), // 面积，单位：平方米
  },
  max_guests: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  bed_type: {
    type: DataTypes.STRING(50),
  },
  facilities: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  discount_rate: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.00,
    validate: {
      min: 0.1,
      max: 1.0,
    },
  },
  available_count: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'RoomType',
  tableName: 'room_types',
});

RoomType.associate = (models) => {
  RoomType.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'hotel' });
  RoomType.hasMany(models.Booking, { foreignKey: 'room_type_id', as: 'bookings' });
};

RoomType.prototype.getDiscountedPrice = function() {
  return (this.base_price * this.discount_rate).toFixed(2);
};

module.exports = RoomType;
