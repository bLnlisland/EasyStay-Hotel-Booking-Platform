<<<<<<< HEAD
const { Sequelize, DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');//用于加密码
const { sequelize } = require('../config/database');
const jwt = require('jsonwebtoken'); 
// 定义 User 模型（用户模型）
class User extends Model {}

User.init({
  id: {  // 用户 ID，自增主键
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {  //用户名
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
    },
  },
  email: {  //用户邮箱
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {  //密码
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100],
    },
  },
  role: {  // 用户角色（商户、管理员、普通用户），默认值为 'user'
    type: DataTypes.ENUM('merchant', 'admin', 'user', 'superadmin'),
    defaultValue: 'user',
    allowNull: false,
  },
  approval_status: {
  type: DataTypes.ENUM('pending', 'approved', 'rejected'),
  defaultValue: 'pending',  // 新注册商户默认为待审核
  allowNull: false,
  field: 'approval_status'  // 数据库中字段名
},
business_name: {
  type: DataTypes.STRING(100),
  allowNull: true,
  field: 'business_name'
},
business_license: {
  type: DataTypes.STRING(100),
  allowNull: true,
  field: 'business_license'
},
license_image: {
  type: DataTypes.STRING(500),
  allowNull: true,
  field: 'license_image'
},
// phone 字段已存在，可复用
// address 如果需要，也可添加
address: {
  type: DataTypes.STRING(200),
  allowNull: true
},
  full_name: {  // 用户全名，可以为空
    type: DataTypes.STRING(100),
  },
  phone: {  // 用户电话，可以为空
    type: DataTypes.STRING(20),
  },
  avatar: {  // 用户头像，默认为默认头像
    type: DataTypes.STRING(500),
    defaultValue: '/default-avatar.png',
  },
  is_active: {  // 用户是否激活，默认为 true
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  last_login: {  // 用户上次登录时间
    type: DataTypes.DATE,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  hooks: {  // 在保存或更新用户信息前，进行密码加密
    beforeSave: async (user) => {
      if (user.changed('password')) {  //如果密码被修改
        const salt = await bcrypt.genSalt(10);//生成盐
        user.password = await bcrypt.hash(user.password, salt);//加密密码
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

User.associate = (models) => {
  User.hasMany(models.Hotel, { foreignKey: 'merchant_id', as: 'hotels' });// 每个用户（商户）拥有多个酒店
  User.hasMany(models.Booking, { foreignKey: 'user_id', as: 'bookings' });// 每个用户（普通用户）有多个预定
  User.hasMany(models.AuditLog, { foreignKey: 'admin_id', as: 'audit_logs' });// 每个管理员有多个审计日志
};

// ============ 添加实例方法 ============

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @returns {Promise<boolean>} - 是否匹配
 */
User.prototype.verifyPassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('密码验证错误:', error);
    return false;
  }
};

/**
 * 生成 JWT 令牌
 * @returns {string} - JWT 令牌
 */
User.prototype.generateToken = function() {
  const payload = {
    id: this.id,
    username: this.username,
    email: this.email,
    role: this.role
  };
  
  // 从环境变量获取密钥，如果没有则使用默认值（仅用于开发）
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
  
  return jwt.sign(payload, jwtSecret, {
    expiresIn: '7d'  // 7天过期
  });
};

// 为了兼容性，也添加静态方法
User.verifyPassword = async function(user, password) {
  return await bcrypt.compare(password, user.password);
};

User.generateToken = function(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
};

// 添加一个简单的方法来检查用户是否是管理员
User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

// 检查是否是商户
User.prototype.isMerchant = function() {
  return this.role === 'merchant';
};

// 检查是否是普通用户
User.prototype.isUser = function() {
  return this.role === 'user';
};

module.exports = User;
=======
const { Sequelize, DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');//用于加密码
const { sequelize } = require('../config/database');
const jwt = require('jsonwebtoken'); 
// 定义 User 模型（用户模型）
class User extends Model {}

User.init({
  id: {  // 用户 ID，自增主键
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {  //用户名
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      notEmpty: true,
    },
  },
  email: {  //用户邮箱
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {  //密码
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100],
    },
  },
  role: {  // 用户角色（商户、管理员、普通用户），默认值为 'user'
    type: DataTypes.ENUM('merchant', 'admin', 'user'),
    defaultValue: 'user',
    allowNull: false,
  },
  full_name: {  // 用户全名，可以为空
    type: DataTypes.STRING(100),
  },
  phone: {  // 用户电话，可以为空
    type: DataTypes.STRING(20),
  },
  avatar: {  // 用户头像，默认为默认头像
    type: DataTypes.STRING(500),
    defaultValue: '/default-avatar.png',
  },
  is_active: {  // 用户是否激活，默认为 true
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  last_login: {  // 用户上次登录时间
    type: DataTypes.DATE,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  hooks: {  // 在保存或更新用户信息前，进行密码加密
    beforeSave: async (user) => {
      if (user.changed('password')) {  //如果密码被修改
        const salt = await bcrypt.genSalt(10);//生成盐
        user.password = await bcrypt.hash(user.password, salt);//加密密码
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

User.associate = (models) => {
  User.hasMany(models.Hotel, { foreignKey: 'merchant_id', as: 'hotels' });// 每个用户（商户）拥有多个酒店
  User.hasMany(models.Booking, { foreignKey: 'user_id', as: 'bookings' });// 每个用户（普通用户）有多个预定
  User.hasMany(models.AuditLog, { foreignKey: 'admin_id', as: 'audit_logs' });// 每个管理员有多个审计日志
};

// ============ 添加实例方法 ============

/**
 * 验证密码
 * @param {string} password - 明文密码
 * @returns {Promise<boolean>} - 是否匹配
 */
User.prototype.verifyPassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('密码验证错误:', error);
    return false;
  }
};

/**
 * 生成 JWT 令牌
 * @returns {string} - JWT 令牌
 */
User.prototype.generateToken = function() {
  const payload = {
    id: this.id,
    username: this.username,
    email: this.email,
    role: this.role
  };
  
  // 从环境变量获取密钥，如果没有则使用默认值（仅用于开发）
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
  
  return jwt.sign(payload, jwtSecret, {
    expiresIn: '7d'  // 7天过期
  });
};

// 为了兼容性，也添加静态方法
User.verifyPassword = async function(user, password) {
  return await bcrypt.compare(password, user.password);
};

User.generateToken = function(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  };
  
  const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
};

// 添加一个简单的方法来检查用户是否是管理员
User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

// 检查是否是商户
User.prototype.isMerchant = function() {
  return this.role === 'merchant';
};

// 检查是否是普通用户
User.prototype.isUser = function() {
  return this.role === 'user';
};

module.exports = User;
>>>>>>> 8d1793c950e1be3944f96d42aed7e3ee695e765f
