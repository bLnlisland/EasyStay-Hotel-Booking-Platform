const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');

class Booking extends Model {}

Booking.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  room_type_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  adults: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  children: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  rooms: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'),
    defaultValue: 'pending',
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'refunded'),
    defaultValue: 'pending',
  },
  payment_method: {
    type: DataTypes.STRING(50),
  },
  special_requests: {
    type: DataTypes.TEXT,
  },
  booking_reference: {
    type: DataTypes.STRING(50),
    unique: true,
  },
}, {
  sequelize,
  modelName: 'Booking',
  tableName: 'bookings',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Booking.associate = (models) => {
  Booking.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  Booking.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'hotel' });
  Booking.belongsTo(models.RoomType, { foreignKey: 'room_type_id', as: 'room_type' });
};

// 生成预订参考号
Booking.beforeCreate(async (booking) => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  booking.booking_reference = `BK${timestamp}${random}`.padEnd(20, '0').substring(0, 20);
});

module.exports = Booking;