const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
//定义Hotel模型（酒店模型）
class Hotel extends Model {}

// 初始化 Hotel 模型
Hotel.init({
  id: {   //酒店 ID，自增主键
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name_zh: {   //中文名
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 200],
    },
  },
  name_en: {   //英文名
    type: DataTypes.STRING(200),
  },
  description: {   // 酒店描述，可以为空
    type: DataTypes.TEXT,
  },
  address: {  //地址
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  city: {   //城市
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  province: {   //省份
    type: DataTypes.STRING(50),
  },
  latitude: {   //纬度
    type: DataTypes.DECIMAL(10, 8),
  },
  longitude: {   //经度
    type: DataTypes.DECIMAL(11, 8),
  },
  star_rating: {   //星级
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
    defaultValue: 3, //默认为3
  },
  opening_year: {   //开业年份
    type: DataTypes.INTEGER,
    validate: {
      min: 1900,
      max: new Date().getFullYear(),
    },
  },
  facilities: {   //设施
    type: DataTypes.JSON,
    defaultValue: [],
  },
  status: {
      type: DataTypes.ENUM('draft', 'pending', 'under_review', 'approved', 'rejected', 'offline'),
      defaultValue: 'draft',
      allowNull: false,
      validate: {
        isIn: [['draft', 'pending', 'under_review', 'approved', 'rejected', 'offline']]
      }
    },
  rejection_reason: {   // 拒绝原因，可选
    type: DataTypes.TEXT,
  },
  contact_phone: {  //联系电话
    type: DataTypes.STRING(20),
  },
  contact_email: {   // 邮箱
    type: DataTypes.STRING(100),
    validate: {
      isEmail: true,  //验证邮箱格式
    },
  },
  check_in_time: {   // 入住时间，默认为 14:00
    type: DataTypes.STRING(10),
    defaultValue: '14:00',
  },
  check_out_time: {    // 退房时间，默认为 12:00
    type: DataTypes.STRING(10),
    defaultValue: '12:00',
  },
  policy: {   //政策
    type: DataTypes.TEXT,
  },
}, {
  sequelize,
  modelName: 'Hotel',
  tableName: 'hotels',
  indexes: [    //创建索引，加速查询
    { fields: ['city'] },
    { fields: ['star_rating'] },
    { fields: ['status'] },
  ],
});

// 关联关系
Hotel.associate = (models) => {
  Hotel.belongsTo(models.User, { foreignKey: 'merchant_id', as: 'merchant' });// 酒店属于一个商户
  Hotel.hasMany(models.RoomType, { foreignKey: 'hotel_id', as: 'room_types' }); // 酒店有多个房型
  Hotel.hasMany(models.HotelImage, { foreignKey: 'hotel_id', as: 'images' });// 酒店有多张图片
 // Hotel.hasMany(models.HotelTag, { foreignKey: 'hotel_id', as: 'tags' });// 酒店有多个标签
  Hotel.hasMany(models.Booking, { foreignKey: 'hotel_id', as: 'bookings' });//酒店有多个预定
  Hotel.hasMany(models.AuditLog, { foreignKey: 'hotel_id', as: 'audit_logs' });// 酒店有多个审计日志
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
