// src/controllers/authController.js - 认证控制器
const db = require('../models');  // 导入数据库对象
const User = db.User;  // 从数据库对象中获取User模型
const Joi = require('joi');
const { Sequelize } = require('sequelize');  // 添加这行
// Joi验证模式
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('merchant', 'admin', 'user').default('user'),  // 添加'admin'
  full_name: Joi.string().max(100),
  phone: Joi.string().max(20),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

class AuthController {
  // 用户注册 - 只保留这一个方法
  static async register(req, res) {
    console.log('🔵 [注册开始] ======================================');
    console.log('请求体:', JSON.stringify(req.body, null, 2));
    
    try {
      
      // 验证请求数据
      console.log('🔵 [1. Joi验证开始]');
      const { error } = registerSchema.validate(req.body);
      if (error) {
        console.log('❌ Joi验证失败:', error.details);
        return res.status(400).json({
          success: false,
          message: '请求数据验证失败',
          errors: error.details.map(detail => detail.message)
        });
      }
      console.log('✅ Joi验证通过');

      const { username, email, password, full_name, phone, role = 'user' } = req.body;
      
      console.log(`🔵 [2. 检查用户名] ${username}`);
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        console.log(`❌ 用户名已存在: ${username}`);
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }
      console.log('✅ 用户名可用');

      console.log(`🔵 [3. 检查邮箱] ${email}`);
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        console.log(`❌ 邮箱已注册: ${email}`);
        return res.status(400).json({
          success: false,
          message: '邮箱已注册'
        });
      }
      console.log('✅ 邮箱可用');

      console.log('🔵 [4. 创建用户]');
      console.log('创建数据:', { username, email, password: '***', role, full_name, phone });
      
      // 创建用户
      const user = await User.create({
        username,
        email,
        password,
        role: role || 'user',
        full_name,
        phone,
      });
      
      console.log(`✅ 用户创建成功，ID: ${user.id}`);

      // 生成令牌
      const token = user.generateToken();
      console.log('✅ Token生成成功');

      // 更新最后登录时间
      await user.update({ last_login: new Date() });
      console.log('✅ 最后登录时间更新');

      // 返回响应
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

      console.log('✅ [注册成功] 返回响应');
      console.log('🟢 [注册结束] ======================================\n');
      
      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: userResponse,
          token,
        }
      });
      
    } catch (error) {
      console.error('🔴 [注册错误] ====================================');
      console.error('错误名称:', error.name);
      console.error('错误信息:', error.message);
      console.error('完整堆栈:', error.stack);
      
      // 如果是Sequelize错误，显示更多详情
      if (error.name === 'SequelizeValidationError') {
        console.error('验证错误详情:');
        error.errors.forEach((err, i) => {
          console.error(`  ${i+1}. 字段 ${err.path}: ${err.message}`);
        });
      } else if (error.name === 'SequelizeDatabaseError') {
        console.error('数据库错误详情:', error.parent?.message || error.message);
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        console.error('唯一约束错误:', error.errors);
      }
      
      console.error('请求数据:', JSON.stringify(req.body, null, 2));
      console.error('🔴 [错误结束] ====================================\n');
      
      res.status(500).json({
        success: false,
        message: '注册失败，服务器错误'
      });
    }
  }

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
    
    // 方法1：使用导入的 Sequelize.Op
    const Op = Sequelize.Op;  // 使用导入的Sequelize
    
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

    console.log('🔵 开始验证密码...');
    // 验证密码
    const isValidPassword = await user.verifyPassword(password);
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
}

module.exports = AuthController;