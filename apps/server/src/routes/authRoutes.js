// src/routes/authRoutes.js - 认证路由
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { auth, validateRequest } = require('../middlewares/auth');

// 公开路由
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// 需要认证的路由
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.put('/change-password', auth, AuthController.changePassword);
router.post('/logout', auth, AuthController.logout);

module.exports = router;