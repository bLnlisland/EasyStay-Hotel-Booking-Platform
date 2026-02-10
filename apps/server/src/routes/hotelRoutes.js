const express = require('express');
const router = express.Router();

// 导入控制器类
const HotelController = require('../controllers/hotelController');
const { auth, roleCheck } = require('../middlewares/auth');

// 公开路由 - 用户端接口
router.get('/public', HotelController.getHotels);  // 获取所有酒店信息（不需要登录）
router.get('/public/:id', HotelController.getHotelById);// 获取单个酒店信息（通过酒店 ID，公开接口）
router.get('/search', HotelController.searchHotels);// 搜索酒店（通过关键字、地址等条件搜索）
router.get('/search/quick', HotelController.quickSearch);//快速搜索酒店（简化版搜索，可能带有预设条件）
//router.get('/cities/popular', HotelController.getPopularCities);// 获取热门城市列表（如：北京、上海等）
router.get('/prices/ranges', HotelController.getPriceRanges);// 获取价格区间（比如：500-1000元，1000-2000元等）
router.get('/facilities/options', HotelController.getFacilityOptions);// 获取设施选项（如：Wi-Fi、游泳池、停车场等）
router.get('/recommended', HotelController.getRecommendedHotels);// 获取推荐酒店列表（可能基于评分、推荐算法等）

// ==================== 商户接口 ====================
router.get('/my', auth, roleCheck('merchant', 'admin'), HotelController.getMyHotels);/// 获取当前商户的酒店列表
router.post('/', auth, roleCheck('merchant', 'admin'), HotelController.createHotel);// 创建新酒店（商户提交酒店信息）
router.put('/:id', auth, roleCheck('merchant', 'admin'), HotelController.updateHotel);// 更新酒店信息
router.post('/:id/submit', auth, roleCheck('merchant', 'admin'), HotelController.submitForReview);// 提交酒店审核
router.delete('/:id', auth, roleCheck('merchant', 'admin'), HotelController.deleteHotel);// 删除酒店
// ==================== 管理员接口 ====================
router.get('/admin/all', auth, roleCheck('admin'), HotelController.getAllHotels);// 获取所有酒店信息（管理员查看所有酒店）
router.put('/admin/:id/status', auth, roleCheck('admin'), HotelController.updateHotelStatus);// 更新酒店的状态（管理员可以审批酒店状态，如通过、拒绝等）
router.get('/admin/stats', auth, roleCheck('admin'), HotelController.getAdminStats);// 获取管理员统计数据（如：酒店数量、预定情况等统计数据）

module.exports = router;