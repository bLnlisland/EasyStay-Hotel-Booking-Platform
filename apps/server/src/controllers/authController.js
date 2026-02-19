// src/controllers/authController.js - 认证控制器
const db = require('../models');  // 导入数据库对象
const User = db.User;  // 从数据库对象中获取User模型
// 确保有这样的导入语句
const Joi = require('joi');
//const Op = Sequelize.Op;
const { Sequelize, Op } = require('sequelize');
// Joi验证模式
// 基础注册验证（普通用户）
const registerUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  full_name: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional(),
});

// 商户注册验证
const registerMerchantSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  business_name: Joi.string().max(100).required(),
  business_license: Joi.string().length(18).required(), // 统一信用代码18位
  license_image: Joi.string().uri().required(),        // 图片URL
  contact_name: Joi.string().max(100).required(),
  phone: Joi.string().max(20).required(),
  address: Joi.string().max(200).optional(),
  full_name: Joi.string().max(100).optional(),
});

// 管理员自助注册验证（与商户一样，公开注册）
const registerAdminSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  full_name: Joi.string().max(100).optional(),
  phone: Joi.string().max(20).optional(),
});
const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

class AuthController {
  // 用户注册 - 只保留这一个方法
  static async register(req, res) {
  try {
    // 只允许注册普通用户（role = user）
    const { error } = registerUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: error.details.map(d => d.message)
      });
    }

    const { username, email, password, full_name, phone } = req.body;

    // 检查用户名/邮箱是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 创建普通用户，角色为 user，直接激活
    const user = await User.create({
      username,
      email,
      password,
      role: 'user',
      approval_status: 'approved', // 普通用户无需审核
      full_name,
      phone,
      is_active: true
    });

    // 生成 token（可选，注册后是否自动登录）
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name
        },
        token
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，服务器错误'
    });
  }
}
// 用户登录
// 用户登录
static async login(req, res) {
  try {
    console.log('🔵 [登录开始] ======================================');
    console.log('请求体:', JSON.stringify(req.body, null, 2));
    
    // 验证请求数据
    const { error } = loginSchema.validate(req.body);
    if (error) {
      console.log('❌ [登录Joi验证失败]:', error.details);
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: error.details.map(detail => detail.message)
      });
    }
    console.log('✅ [登录Joi验证通过]');

    const { username, password } = req.body;
    console.log(`🔵 [查找用户] 使用标识符: ${username}`);
    
    // 查找用户（无需重复定义Op，顶部已导入）
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { username },
          { email: username }
        ]
      }
    });

    console.log(`🔵 查询结果: ${user ? '找到用户' : '未找到用户'}`);

    if (!user) {
      console.log('❌ 用户不存在');
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    if (!user.is_active) {
      console.log('❌ 用户已被禁用');
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    // 唯一的密码校验 + 详细日志
    console.log('🔵 开始验证密码...');
    console.log('🔵 前端传入明文密码:', password);
    console.log('🔵 数据库加密密码:', user.password);
    const isValidPassword = await user.verifyPassword(password);
    console.log('🔵 密码校验结果:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ 密码错误');
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    console.log('✅ 密码正确');

    // 生成令牌
    const token = user.generateToken();
    console.log('✅ Token生成成功');

    // 更新最后登录时间
    await user.update({ last_login: new Date() });
    console.log('✅ 最后登录时间更新');

    // 返回响应（不返回密码）
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
      phone: user.phone,
      avatar: user.avatar,
      is_active: user.is_active,
    };

    console.log('✅ [登录成功] 返回响应');
    console.log('🟢 [登录结束] ======================================\n');

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: userResponse,
        token,
      }
    });
  } catch (error) {
    console.error('🔴 [登录错误] ====================================');
    console.error('错误名称:', error.name);
    console.error('错误信息:', error.message);
    console.error('完整堆栈:', error.stack);
    console.error('🔴 [错误结束] ====================================\n');
    
    res.status(500).json({
      success: false,
      message: '登录失败，服务器错误'
    });
  }
}

  // 获取当前用户信息
  static async getProfile(req, res) {
    try {
      const user = req.user;
      
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar: user.avatar,
        is_active: user.is_active,
        last_login: user.last_login,
      };

      res.json({
        success: true,
        data: userResponse
      });
    } catch (error) {
      console.error('获取用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '获取用户信息失败'
      });
    }
  }

  // 更新用户信息
  static async updateProfile(req, res) {
    try {
      const user = req.user;
      const { full_name, phone, avatar } = req.body;

      // 更新用户信息
      await user.update({
        full_name: full_name || user.full_name,
        phone: phone || user.phone,
        avatar: avatar || user.avatar,
      });

      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        phone: user.phone,
        avatar: user.avatar,
        is_active: user.is_active,
      };

      res.json({
        success: true,
        message: '个人信息更新成功',
        data: userResponse
      });
    } catch (error) {
      console.error('更新用户信息错误:', error);
      res.status(500).json({
        success: false,
        message: '更新个人信息失败'
      });
    }
  }

  // 修改密码
  static async changePassword(req, res) {
    try {
      const user = req.user;
      const { current_password, new_password } = req.body;

      // 验证当前密码
      const isValidPassword = await user.verifyPassword(current_password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: '当前密码错误'
        });
      }

      // 更新密码
      user.password = new_password;
      await user.save();

      // 生成新令牌
      const token = user.generateToken();

      res.json({
        success: true,
        message: '密码修改成功',
        data: { token }
      });
    } catch (error) {
      console.error('修改密码错误:', error);
      res.status(500).json({
        success: false,
        message: '修改密码失败'
      });
    }
  }

  // 退出登录（实际上由前端删除token）
  static async logout(req, res) {
    res.json({
      success: true,
      message: '已退出登录'
    });
  }

  // 诊断端点
  static async diagnose(req, res) {
    try {
      console.log('🔧 [诊断端点] 被调用');
      
      // 测试数据库连接
      const { sequelize } = require('../config/database');
      await sequelize.authenticate();
      console.log('✅ 数据库连接正常');
      
      console.log('✅ User模型加载正常');
      
      // 测试bcrypt
      const bcrypt = require('bcryptjs');
      const testHash = await bcrypt.hash('test', 10);
      console.log('✅ bcrypt加密正常');
      
      // 测试直接创建用户
      const timestamp = Date.now();
      const testUser = await User.create({
        username: `diagnose_${timestamp}`,
        email: `diagnose_${timestamp}@example.com`,
        password: 'Diagnose123!',
        role: 'user'
      });
      console.log(`✅ 直接创建用户成功，ID: ${testUser.id}`);
      
      // 清理测试用户
      await testUser.destroy();
      console.log('✅ 测试用户已清理');
      
      res.json({
        success: true,
        message: '诊断完成，所有测试通过',
        tests: [
          '数据库连接正常',
          'User模型正常',
          'bcrypt加密正常',
          '直接创建用户正常'
        ]
      });
      
    } catch (error) {
      console.error('🔧 [诊断失败]:', error);
      res.status(500).json({
        success: false,
        message: '诊断失败',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
  // ==================== 新增：商户注册 ====================
  static async registerMerchant(req, res) {
  try {
    const { error } = registerMerchantSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: error.details.map(d => d.message)
      });
    }

    const {
      username,
      email,
      password,
      business_name,
      business_license,
      license_image,
      contact_name,
      phone,
      address,
      full_name
    } = req.body;

    // 检查用户名/邮箱是否已存在
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 创建商户用户，待审核
    const user = await User.create({
      username,
      email,
      password,
      role: 'merchant',
      approval_status: 'pending',
      business_name,
      business_license,
      license_image,
      contact_name,
      phone,
      address,
      full_name,
      is_active: true
    });

    res.status(201).json({
      success: true,
      message: '商户注册成功，请等待管理员审核',
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        approval_status: user.approval_status,
        business_name: user.business_name
      }
    });
  } catch (error) {
    console.error('商户注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，服务器错误'
    });
  }
}
  // ==================== 管理员自助注册（与商户一样，无需登录） ====================
  static async registerAdmin(req, res) {
  try {
    const { error } = registerAdminSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: '请求数据验证失败',
        errors: error.details.map(d => d.message)
      });
    }

    const { username, email, password, full_name, phone } = req.body;

    const existing = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    const admin = await User.create({
      username,
      email,
      password,
      role: 'admin',
      approval_status: 'approved',
      is_active: true,
      full_name,
      phone
    });

    res.status(201).json({
      success: true,
      message: '管理员创建成功',
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('创建管理员错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
}
}

module.exports = AuthController;