// src/config/config.js - 数据库配置文件（增强版）
require('dotenv').config();

// 提取环境变量并提供默认值
const {
  DB_USER = 'root',
  DB_PASSWORD = '12345',
  DB_NAME = 'hotel_booking',
  DB_HOST = 'localhost',
  DB_PORT = 3306
} = process.env;

// 将端口转换为整数
const PORT = parseInt(DB_PORT, 10);

module.exports = {
  development: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    port: PORT,
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00'
  },

  test: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: `${DB_NAME}_test`,
    host: DB_HOST,
    port: PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },

  production: {
    username: DB_USER,
    password: DB_PASSWORD,
    database: `${DB_NAME}_prod`,
    host: DB_HOST,
    port: PORT,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 20000
    }
  }
};