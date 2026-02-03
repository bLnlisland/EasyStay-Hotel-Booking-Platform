// src/controllers/authController.js - 认证控制器
const { User } = require('../models');
const Joi = require('joi');

// Joi验证模式
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('merchant', 'user').default('user'),
  full_name: Joi.string().max(100),
  phone: Joi.string().max(20),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

class AuthController {
  // 用户注册
  static async register(req, res) {
    try {
      // 验证请求数据
      const { error } = registerSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '请求数据验证失败',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { username, email, password, role, full_name, phone } = req.body;

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        });
      }

      // 检查邮箱是否已存在
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已注册'
        });
      }

      // 创建用户
      const user = await User.create({
        username,
        email,
        password,
        role,
        full_name,
        phone,
      });

      // 生成令牌
      const token = user.generateToken();

      // 更新最后登录时间
      await user.update({ last_login: new Date() });

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

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          user: userResponse,
          token,
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
  static async login(req, res) {
    try {
      // 验证请求数据
      const { error } = loginSchema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          message: '请求数据验证失败',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { username, password } = req.body;

      // 查找用户（按用户名或邮箱）
      const user = await User.findOne({
        where: {
          [User.Sequelize.Op.or]: [
            { username },
            { email: username }
          ]
        }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      if (!user.is_active) {
        return res.status(401).json({
          success: false,
          message: '账户已被禁用，请联系管理员'
        });
      }

      // 验证密码
      const isValidPassword = await user.verifyPassword(password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 生成令牌
      const token = user.generateToken();

      // 更新最后登录时间
      await user.update({ last_login: new Date() });

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

      res.json({
        success: true,
        message: '登录成功',
        data: {
          user: userResponse,
          token,
        }
      });
    } catch (error) {
      console.error('登录错误:', error);
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
}

module.exports = AuthController;