const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
// 酒店图片属于一个酒店
class RoomType extends Model {}

RoomType.init({    
  id: {   // 房型 ID，自增主键
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {  //房型名称
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {  //房型描述
    type: DataTypes.TEXT,
  },
  area: {   //房型面积
    type: DataTypes.DECIMAL(6, 2), // 面积，单位：平方米
  },
  max_guests: {  //最大入住人数
    type: DataTypes.INTEGER,
    defaultValue: 2,
  },
  bed_type: {  //床型
    type: DataTypes.STRING(50),
  },
  facilities: {   //房型设施
    type: DataTypes.JSON,
    defaultValue: [],
  },
  base_price: {   //价格（元/晚）
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  available_count: {   //可用房间数量
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  is_available: {    //是否可用
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'RoomType',
  tableName: 'room_types',
});

RoomType.associate = (models) => {
  RoomType.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'hotel' });// 每个房型属于一个酒店
  RoomType.hasMany(models.Booking, { foreignKey: 'room_type_id', as: 'bookings' });// 每个房型有多个预定
};

module.exports = RoomType;
