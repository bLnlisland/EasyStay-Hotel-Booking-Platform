const express = require('express');
const router = express.Router();

// 导入控制器类
const HotelController = require('../controllers/hotelController');
const { auth, roleCheck } = require('../middlewares/auth');

// 公开路由 - 用户端接口
router.get('/public', HotelController.getHotels);  
router.get('/public/:id', HotelController.getHotelById);
router.get('/search', HotelController.searchHotels);
router.get('/search/quick', HotelController.quickSearch);
router.get('/cities/popular', HotelController.getPopularCities);
router.get('/prices/ranges', HotelController.getPriceRanges);
router.get('/facilities/options', HotelController.getFacilityOptions);
router.get('/recommended', HotelController.getRecommendedHotels);

// ==================== 商户接口 ====================
router.get('/my', auth, roleCheck('merchant', 'admin'), HotelController.getMyHotels);
router.post('/', auth, roleCheck('merchant', 'admin'), HotelController.createHotel);
router.put('/:id', auth, roleCheck('merchant', 'admin'), HotelController.updateHotel);
router.post('/:id/submit', auth, roleCheck('merchant', 'admin'), HotelController.submitForReview);
router.delete('/:id', auth, roleCheck('merchant', 'admin'), HotelController.deleteHotel);

router.get('/admin/all', auth, roleCheck('admin'), HotelController.getAllHotels);
router.put('/admin/:id/status', auth, roleCheck('admin'), HotelController.updateHotelStatus);
router.get('/admin/stats', auth, roleCheck('admin'), HotelController.getAdminStats);

module.exports = router;