const express = require('express');
const router = express.Router({ mergeParams: true });

const { auth, roleCheck } = require('../middlewares/auth');
const { upload } = require('../middlewares/upload');
const controller = require('../controllers/hotelImageController');

// ✅ 用户端：获取酒店图片（公开）
router.get('/', controller.listHotelImages);

// ✅ 商户/管理员：上传图片
router.post(
  '/',
  auth,
  roleCheck('merchant', 'admin'),
  upload.array('images', 10),
  controller.uploadHotelImages
);

// ✅ 商户/管理员：删除图片
router.delete(
  '/:imageId',
  auth,
  roleCheck('merchant', 'admin'),
  controller.deleteHotelImage
);

module.exports = router;
console.log('✅ hotelImageRoutes loaded');
