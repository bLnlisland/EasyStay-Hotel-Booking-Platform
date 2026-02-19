// src/routes/authRoutes.js - 认证路由
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { auth, validateRequest } = require('../middlewares/auth');

// ========== 公开路由（无需 token，放最前避免被其他路由或中间件影响） ==========
router.post('/register', AuthController.register);
router.post('/register/merchant', AuthController.registerMerchant);
router.post('/register/admin', AuthController.registerAdmin); // 管理员自助注册
router.post('/login', AuthController.login);
router.get('/diagnose', AuthController.diagnose);

// ========== 需要认证的路由 ==========
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.put('/change-password', auth, AuthController.changePassword);
router.post('/logout', auth, AuthController.logout);

module.exports = router;