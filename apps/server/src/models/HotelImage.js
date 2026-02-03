const { Sequelize, DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/database');
class HotelImage extends Model {}

HotelImage.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  url: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  alt_text: {
    type: DataTypes.STRING(200),
  },
  is_main: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'HotelImage',
  tableName: 'hotel_images',
});

HotelImage.associate = (models) => {
  HotelImage.belongsTo(models.Hotel, { foreignKey: 'hotel_id', as: 'hotel' });
};

module.exports = HotelImage;
