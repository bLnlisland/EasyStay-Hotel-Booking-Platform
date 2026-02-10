const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
// 定义 HotelImage 模型（酒店图片模型）
class HotelImage extends Model {}

HotelImage.init({
  id: {    // 图片 ID，自增主键
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  url: {   // 图片 URL，不能为空
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  alt_text: {   // 图片的描述文字，可以为空
    type: DataTypes.STRING(200),
  },
  is_main: {   // 是否为主图，默认为 false
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  order: {  // 图片的顺序，默认为 0
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'HotelImage',
  tableName: 'hotel_images',
});

HotelImage.associate = (models) => {
  HotelImage.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'hotel' });// 酒店图片属于一个酒店
};

module.exports = HotelImage;
