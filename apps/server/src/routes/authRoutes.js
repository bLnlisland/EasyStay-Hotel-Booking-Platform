// src/routes/authRoutes.js - 认证路由
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { auth, validateRequest } = require('../middlewares/auth');

// 公开路由
router.post('/register', AuthController.register);// 用户注册
// POST /api/auth/register
router.post('/login', AuthController.login);// 用户登录
// POST /api/auth/login

// 需要认证的路由
router.get('/profile', auth, AuthController.getProfile);// 更新当前登录用户信息
// PUT /api/auth/profile
router.put('/profile', auth, AuthController.updateProfile);// 修改密码
// PUT /api/auth/change-password
router.put('/change-password', auth, AuthController.changePassword);// 退出登录
// POST /api/auth/logout
router.post('/logout', auth, AuthController.logout);// 导出路由，供 app.js / index.js 使用

router.get('/diagnose', AuthController.diagnose);

module.exports = router;