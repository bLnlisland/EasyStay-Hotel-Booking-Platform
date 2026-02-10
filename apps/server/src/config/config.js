// src/config/config.js - 数据库配置文件
require('dotenv').config();

module.exports = {
  development: {  //开发环境
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: console.log,  // 开发时显示SQL语句
    pool: {
      max: 10,        // 最大连接数
      min: 0,         // 最小连接数
      acquire: 30000, // 获取连接超时时间(毫秒)
      idle: 10000     // 连接空闲时间(毫秒)
    },
    timezone: '+08:00', // 东八区(北京时间)
  },
  test: {  //测试环境
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + '_test',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  },
  production: {  //生产环境
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME + '_prod',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    //连接池配置
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 20000
    },
  }
};