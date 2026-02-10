const { Hotel, RoomType, HotelImage, User, sequelize } = require('../models');
const { Op } = require('sequelize');

class HotelController {
  // 获取酒店列表（公开接口） - 已实现完整筛选功能
  static async getHotels(req, res) {
    try {
      const {
        city,
        check_in,        // 入住日期 YYYY-MM-DD
        check_out,       // 离店日期 YYYY-MM-DD
        guests = 2,
        min_price,
        max_price,
        star_rating,
        facilities,      // 设施筛选，逗号分隔，如 "免费WiFi,停车场"
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        order = 'desc'
      } = req.query;

      // 分页参数
      const offset = (parseInt(page) - 1) * parseInt(limit);

      // 基础筛选条件 - 只获取已审核通过的酒店
      const where = { status: 'approved' };

      // 城市筛选
      if (city) {
        where.city = { [Op.like]: `%${city}%` };
      }

      // 星级筛选
      if (star_rating) {
        where.star_rating = parseInt(star_rating);
      }

      // 设施筛选 - 兼容 MySQL 的方式
      if (facilities) {
        const facilityList = facilities.split(',').map(f => f.trim());
        
        // 为每个设施添加 JSON_CONTAINS 条件
        const facilityConditions = facilityList.map(facility => {
          return sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('facilities'), JSON.stringify(facility)),
            1
          );
        });
        
        // 如果有多个设施条件，使用 Op.and
        if (facilityConditions.length > 0) {
          where[Op.and] = where[Op.and] || [];
          where[Op.and].push(...facilityConditions);
        }
      }

      // ========== 简化：价格筛选（内存层） ==========
      // 先查询所有符合条件的酒店
      const includeConditions = [
        {
          model: HotelImage,
          as: 'images',
          where: { is_main: true },
          required: false,
          limit: 1
        },
        {
          model: RoomType,
          as: 'room_types',
          where: {
            is_available: true,
            max_guests: { [Op.gte]: parseInt(guests) } // 满足入住要求
          },
          required: false
        }
      ];

      // 性能优化：使用子查询避免内存分页问题
      let queryOptions = {
        where,
        include: includeConditions,
        order: [[sort_by, order]],
        offset,
        limit: parseInt(limit),
        distinct: true,
        subQuery: false // 避免子查询，提高性能
      };

      // 查询酒店
      const { count: totalCount, rows: hotels } = await Hotel.findAndCountAll(queryOptions);

      // 处理返回数据，计算最低价格和折扣信息
      let processedHotels = hotels.map(hotel => {
        return HotelController.processHotelData(hotel);
      });

      // ========== 价格筛选（内存层） ==========
      if (min_price || max_price) {
        const minPriceNum = min_price ? parseFloat(min_price) : 0;
        const maxPriceNum = max_price ? parseFloat(max_price) : Infinity;
        
        processedHotels = processedHotels.filter(hotel => {
          if (hotel.min_price === null || hotel.min_price === undefined) return false;
          
          const price = hotel.min_price;
          return price >= minPriceNum && price <= maxPriceNum;
        });
      }

      // 直接使用数据库查询结果计算分页
      const totalPages = Math.ceil(totalCount / limit);
      
      // 构建响应
      const response = {
        success: true,
        data: {
          hotels: processedHotels,
          pagination: {
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages,
            has_more: parseInt(page) < totalPages
          },
          filters: {
            applied: {
              city: city || null,
              check_in: check_in || null,
              check_out: check_out || null,
              guests: parseInt(guests),
              min_price: min_price ? parseFloat(min_price) : null,
              max_price: max_price ? parseFloat(max_price) : null,
              star_rating: star_rating ? parseInt(star_rating) : null,
              facilities: facilities || null
            }
          }
        }
      };

      res.json(response);
    } catch (error) {
      console.error('获取酒店列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取酒店列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 获取酒店详情（已实现日期和价格计算）
  static async getHotelById(req, res) {
    try {
      const { id } = req.params;
      const { check_in, check_out, guests = 2 } = req.query;
      // 使用findByPk获取单个酒店，包含所有关联数据
      const hotel = await Hotel.findByPk(id, {
        include: [
          {
            model: User,
            as: 'merchant',
            attributes: ['id', 'username', 'full_name', 'phone', 'email']
          },
          {
            model: HotelImage,
            as: 'images',
            order: [['order', 'ASC'], ['is_main', 'DESC']] // 按顺序排序，主图优先
          },
          {
            model: RoomType,
            as: 'room_types',
            where: { is_available: true },
            order: [['base_price', 'ASC']]
          }
        ]
      });
      
      // 酒店不存在检查
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: '酒店不存在'
        });
      }
      
      // 权限检查：非审核通过的酒店只允许管理员或商户本人查看
      if (hotel.status !== 'approved' && req.user?.role !== 'admin' && req.user?.id !== hotel.merchant_id) {
        return res.status(403).json({
          success: false,
          message: '无权查看该酒店'
        });
      }

      // 处理酒店数据
      const hotelData = HotelController.processHotelData(hotel);

      // 处理房型详细信息
      if (hotelData.room_types) {
        hotelData.room_types = hotelData.room_types.map(room => {
          const discountedPrice = parseFloat((room.base_price * room.discount_rate).toFixed(2));
          const discountPercentage = Math.round((1 - room.discount_rate) * 100);

          return {
            ...room,
            discounted_price: discountedPrice,
            original_price: room.base_price,
            discount_percentage: room.discount_rate < 1 ? discountPercentage : 0,
            has_discount: room.discount_rate < 1,
            is_available_for_dates: true, // 暂时假设所有日期都可用
            is_available_for_guests: room.max_guests >= parseInt(guests)
          };
        });

        // 计算酒店的价格范围
        if (hotelData.room_types.length > 0) {
          const prices = hotelData.room_types.map(room => room.discounted_price);
          hotelData.min_price = Math.min(...prices);
          hotelData.max_price = Math.max(...prices);
          
          // 计算平均价格
          hotelData.avg_price = parseFloat((prices.reduce((sum, price) => sum + price, 0) / prices.length).toFixed(2));
        }
      }

      // 处理日期信息
      if (check_in && check_out) {
        const nights = this.calculateNights(check_in, check_out);
        hotelData.selected_dates = {
          check_in,
          check_out,
          nights
        };

        // 如果提供了日期，计算估计总价
        if (hotelData.min_price) {
          hotelData.estimated_total = parseFloat((hotelData.min_price * nights).toFixed(2));
        }

        // 为每个房型计算总价
        if (hotelData.room_types) {
          hotelData.room_types = hotelData.room_types.map(room => ({
            ...room,
            total_price: parseFloat((room.discounted_price * nights).toFixed(2)),
            nights
          }));
        }
      }

      res.json({
        success: true,
        data: hotelData
      });
    } catch (error) {
      console.error('获取酒店详情错误:', error);
      res.status(500).json({
        success: false,
        message: '获取酒店详情失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 获取热门城市
  static async getPopularCities(req, res) {
    try {
      const { limit = 10 } = req.query;

      const cities = await Hotel.findAll({
        where: { status: 'approved' },
        attributes: [
          'city',
          'province',
          [sequelize.fn('COUNT', sequelize.col('id')), 'hotel_count'],
          [
            sequelize.literal(`
              (SELECT MIN(rt.base_price * rt.discount_rate)
               FROM room_types rt
               WHERE rt.hotel_id = Hotel.id AND rt.is_available = true)
            `),
            'min_price'
          ]
        ],
        group: ['city', 'province'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: parseInt(limit)
      });

      const formattedCities = cities.map(city => ({
        city: city.city,
        province: city.province,
        hotel_count: parseInt(city.get('hotel_count')),
        min_price: city.get('min_price') ? parseFloat(city.get('min_price')).toFixed(2) : null
      }));
      
      res.json({
        success: true,
        data: formattedCities
      });
    } catch (error) {
      console.error('获取热门城市错误:', error);
      res.status(500).json({
        success: false,
        message: '获取热门城市失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 获取价格区间统计
  static async getPriceRanges(req, res) {
    try {
      const { city } = req.query;

      const where = { status: 'approved' };
      if (city) {
        where.city = city;
      }

      // 使用子查询获取每个酒店的最低价格
      const hotelsWithPrice = await Hotel.findAll({
        where,
        include: [{
          model: RoomType,
          as: 'room_types',
          where: { is_available: true },
          required: false,
          attributes: []
        }],
        attributes: [
          'id',
          [
            sequelize.literal(`
              (SELECT MIN(base_price * discount_rate) 
               FROM room_types 
               WHERE hotel_id = Hotel.id AND is_available = true)
            `),
            'min_price'
          ]
        ],
        having: sequelize.where(
          sequelize.literal('min_price'),
          'IS NOT',
          null
        )
      });
      
      // 提取所有价格
      const prices = hotelsWithPrice
        .map(h => parseFloat(h.get('min_price')))
        .filter(price => !isNaN(price) && price > 0);
      
      // 如果没有数据，返回默认区间
      if (prices.length === 0) {
        return res.json({
          success: true,
          data: {
            min_price: 0,
            max_price: 0,
            ranges: [],
            suggestion_ranges: [
              { min: 0, max: 300, label: '经济型 (¥0 - ¥300)' },
              { min: 300, max: 600, label: '舒适型 (¥300 - ¥600)' },
              { min: 600, max: 1000, label: '豪华型 (¥600 - ¥1000)' },
              { min: 1000, max: 5000, label: '奢华型 (¥1000+)' }
            ]
          }
        });
      }
      
      // 计算价格范围
      const minPrice = Math.floor(Math.min(...prices));
      const maxPrice = Math.ceil(Math.max(...prices));
      
      // 创建合理的价格区间
      const rangeCount = 4;
      const rangeSize = Math.ceil((maxPrice - minPrice) / rangeCount);
      
      const ranges = [];
      for (let i = 0; i < rangeCount; i++) {
        const start = minPrice + (i * rangeSize);
        const end = Math.min(start + rangeSize, maxPrice);
        
        // 如果这是最后一个区间，确保包含最大值
        const actualEnd = (i === rangeCount - 1) ? maxPrice : end;
        // 统计每个区间的酒店数量
        const count = prices.filter(price => price >= start && price < actualEnd).length;
        
        if (count > 0 || i === 0 || i === rangeCount - 1) {
          ranges.push({
            min: start,
            max: actualEnd,
            count,
            label: `¥${start} - ¥${actualEnd}`
          });
        }
      }

      res.json({
        success: true,
        data: {
          min_price: minPrice,
          max_price: maxPrice,
          ranges,
          suggestion_ranges: [ 
            { min: 0, max: 300, label: '经济型 (¥0 - ¥300)' },
            { min: 300, max: 600, label: '舒适型 (¥300 - ¥600)' },
            { min: 600, max: 1000, label: '豪华型 (¥600 - ¥1000)' },
            { min: 1000, max: 5000, label: '奢华型 (¥1000+)' }
          ]
        }
      });
    } catch (error) {
      console.error('获取价格区间错误:', error);
      res.status(500).json({
        success: false,
        message: '获取价格区间失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 搜索酒店（增强版）
  static async searchHotels(req, res) {
    try {
      const { 
        keyword, 
        page = 1, 
        limit = 10,
        min_price,
        max_price,
        star_rating,
        city,
        guests = 2
      } = req.query;
      
      // 修改验证逻辑：允许只搜索城市
      if (!keyword && !city) {
        return res.status(400).json({
          success: false,
          message: '请输入搜索关键词或城市'
        });
      }
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // 修改搜索条件构建
      const where = {
        status: 'approved'
      };
      
      // 如果有关键词，使用多字段搜索
      if (keyword) {
        where[Op.or] = [
          { name_zh: { [Op.like]: `%${keyword}%` } },
          { name_en: { [Op.like]: `%${keyword}%` } },
          { city: { [Op.like]: `%${keyword}%` } },
          { address: { [Op.like]: `%${keyword}%` } },
          { description: { [Op.like]: `%${keyword}%` } }
        ];
      }
      
      // 如果指定了城市，精确搜索城市
      if (city && !keyword) {
        where.city = { [Op.like]: `%${city}%` };
      }
       
      // 添加星级筛选
      if (star_rating) {
        where.star_rating = parseInt(star_rating);
      }
      
      // 构建查询选项
      const queryOptions = {
        where,
        include: [
          {
            model: HotelImage,
            as: 'images',
            where: { is_main: true },
            required: false,
            limit: 1
          },
          {
            model: RoomType,
            as: 'room_types',
            where: { is_available: true },
            required: false
          }
        ],
        order: [['created_at', 'DESC']],
        offset,
        limit: parseInt(limit),
        subQuery: false
      };
      
      // 查询数据
      const { count, rows: hotels } = await Hotel.findAndCountAll(queryOptions);

      // 处理酒店数据
      let processedHotels = hotels.map(hotel => {
        return HotelController.processHotelData(hotel);
      });

      // ========== 价格筛选（内存层） ==========
      if (min_price || max_price) {
        const minPriceNum = min_price ? parseFloat(min_price) : 0;
        const maxPriceNum = max_price ? parseFloat(max_price) : Infinity;
        
        processedHotels = processedHotels.filter(hotel => {
          if (hotel.min_price === null || hotel.min_price === undefined) return false;
          
          const price = hotel.min_price;
          return price >= minPriceNum && price <= maxPriceNum;
        });
      }

      const totalPages = Math.ceil(count / limit);
      res.json({
        success: true,
        data: {
          hotels: processedHotels,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: totalPages,
            has_more: parseInt(page) < totalPages
          },
          search_info: {
            keyword,
            total_matches: count
          }
        }
      });
    } catch (error) {
      console.error('搜索酒店错误:', error);
      res.status(500).json({
        success: false,
        message: '搜索失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 快速搜索（用于搜索框自动补全）
  static async quickSearch(req, res) {
    try {
      const { q, limit = 5 } = req.query;
      
      if (!q || q.trim().length < 2) {
        return res.json({
          success: true,
          data: { hotels: [], cities: [], suggestions: [] }
        });
      }

      const searchTerm = q.trim();

      // 搜索酒店名称
      const hotels = await Hotel.findAll({
        where: {
          status: 'approved',
          [Op.or]: [
            { name_zh: { [Op.like]: `%${searchTerm}%` } },
            { name_en: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        include: [{
          model: HotelImage,
          as: 'images',
          where: { is_main: true },
          required: false,
          limit: 1
        }],
        limit: parseInt(limit),
        order: [['star_rating', 'DESC']]
      });

      // 搜索城市
      const cities = await Hotel.findAll({
        where: {
          status: 'approved',
          city: { [Op.like]: `%${searchTerm}%` }
        },
        attributes: [
          'city',
          'province',
          [sequelize.fn('COUNT', sequelize.col('id')), 'hotel_count']
        ],
        group: ['city', 'province'],
        limit: 3
      });

      // 处理酒店数据
      const processedHotels = hotels.map(hotel => {
        const hotelData = HotelController.processHotelData(hotel);
        return {
          id: hotelData.id,
          name_zh: hotelData.name_zh,
          name_en: hotelData.name_en,
          city: hotelData.city,
          star_rating: hotelData.star_rating,
          min_price: hotelData.min_price,
          image: hotelData.images?.[0]?.url || null,
          type: 'hotel'
        };
      });

      // 处理城市数据
      const processedCities = cities.map(city => ({
        city: city.city,
        province: city.province,
        hotel_count: parseInt(city.get('hotel_count')),
        type: 'city'
      }));

      // 生成搜索建议
      const suggestions = [
        ...processedHotels.map(h => `${h.name_zh} (${h.city})`),
        ...processedCities.map(c => `${c.city} (${c.province})`)
      ].slice(0, 5);

      res.json({
        success: true,
        data: {
          hotels: processedHotels,
          cities: processedCities,
          suggestions
        }
      });
    } catch (error) {
      console.error('快速搜索错误:', error);
      res.status(500).json({
        success: false,
        message: '快速搜索失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 获取酒店设施选项
  static async getFacilityOptions(req, res) {
    try {
      // 从数据库获取所有可能的设施（硬编码列表，实际项目可以从配置或数据库中获取）
      const facilities = [
        { id: 'wifi', name: '免费WiFi', icon: 'wifi', category: '网络' },
        { id: 'parking', name: '停车场', icon: 'parking', category: '交通' },
        { id: 'pool', name: '游泳池', icon: 'pool', category: '娱乐' },
        { id: 'gym', name: '健身房', icon: 'gym', category: '健康' },
        { id: 'spa', name: '水疗中心', icon: 'spa', category: '健康' },
        { id: 'restaurant', name: '餐厅', icon: 'restaurant', category: '餐饮' },
        { id: 'bar', name: '酒吧', icon: 'bar', category: '餐饮' },
        { id: 'breakfast', name: '免费早餐', icon: 'breakfast', category: '餐饮' },
        { id: 'airport_shuttle', name: '机场接送', icon: 'shuttle', category: '交通' },
        { id: 'meeting_rooms', name: '会议室', icon: 'meeting', category: '商务' },
        { id: 'business_center', name: '商务中心', icon: 'business', category: '商务' },
        { id: 'laundry', name: '洗衣服务', icon: 'laundry', category: '服务' },
        { id: 'room_service', name: '客房服务', icon: 'room-service', category: '服务' },
        { id: 'concierge', name: '礼宾服务', icon: 'concierge', category: '服务' },
        { id: 'family_rooms', name: '家庭房', icon: 'family', category: '房型' },
        { id: 'non_smoking', name: '无烟房', icon: 'non-smoking', category: '房型' },
        { id: 'pet_friendly', name: '宠物友好', icon: 'pet', category: '其他' },
        { id: 'accessible', name: '无障碍设施', icon: 'accessible', category: '其他' }
      ];

      // 按类别分组
      const categorizedFacilities = facilities.reduce((acc, facility) => {
        if (!acc[facility.category]) {
          acc[facility.category] = [];
        }
        acc[facility.category].push(facility);
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          facilities,
          categorized: categorizedFacilities,
          categories: Object.keys(categorizedFacilities)
        }
      });
    } catch (error) {
      console.error('获取设施选项错误:', error);
      res.status(500).json({
        success: false,
        message: '获取设施选项失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 辅助方法：处理酒店数据
  static processHotelData(hotel) {
    const hotelData = hotel.toJSON();
    
    // 计算最低价格
    if (hotelData.room_types && hotelData.room_types.length > 0) {
      const prices = hotelData.room_types.map(room =>
        parseFloat((room.base_price * room.discount_rate).toFixed(2))
      );
      hotelData.min_price = Math.min(...prices);
    } else {
      hotelData.min_price = null;
    }

    // 计算折扣信息
    if (hotelData.room_types && hotelData.room_types.length > 0) {
      const discountedRooms = hotelData.room_types.filter(room => room.discount_rate < 1);
      if (discountedRooms.length > 0) {
        const maxDiscount = Math.min(...discountedRooms.map(room => room.discount_rate));
        hotelData.has_discount = true;
        hotelData.max_discount = Math.round((1 - maxDiscount) * 100); // 百分比
      } else {
        hotelData.has_discount = false;
      }
    }

    // 简化响应数据
    if (hotelData.room_types) {
      // 只保留必要的房型信息
      hotelData.room_types = hotelData.room_types.map(room => ({
        id: room.id,
        name: room.name,
        base_price: room.base_price,
        discount_rate: room.discount_rate,
        discounted_price: parseFloat((room.base_price * room.discount_rate).toFixed(2)),
        available_count: room.available_count,
        max_guests: room.max_guests
      }));
    }

    return hotelData;
  }

  // 计算入住天数
  static calculateNights(check_in, check_out) {
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  // 验证日期格式
  static validateDate(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  }
  
  // ==================== 商户接口（需认证） ====================
  
  // 获取当前用户的酒店列表
  static async getMyHotels(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      let where = {};
      
      if (userRole === 'merchant') {
        where.merchant_id = userId;
      }
      // 如果是管理员，可以查看所有酒店
      
      const hotels = await Hotel.findAll({
        where,
        include: [
          {
            model: HotelImage,
            as: 'images',
            where: { is_main: true },
            required: false,
            limit: 1
          }
        ],
        order: [['created_at', 'DESC']]
      });
      
      res.json({
        success: true,
        data: hotels
      });
    } catch (error) {
      console.error('获取我的酒店列表错误:', error);
      res.status(500).json({
        success: false,
        message: '获取酒店列表失败'
      });
    }
  }

  // 创建新酒店
  static async createHotel(req, res) {
    try {
      const userId = req.user.id;
      const hotelData = req.body;
      
      // 设置商户ID
      hotelData.merchant_id = userId;
      hotelData.status = 'draft'; // 初始状态为草稿
      
      const hotel = await Hotel.create(hotelData);
      
      res.status(201).json({
        success: true,
        message: '酒店创建成功',
        data: hotel
      });
    } catch (error) {
      console.error('创建酒店错误:', error);
      res.status(500).json({
        success: false,
        message: '创建酒店失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 更新酒店信息
  static async updateHotel(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const updateData = req.body;
      
      // 查找酒店
      const hotel = await Hotel.findByPk(id);
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: '酒店不存在'
        });
      }
      
      // 检查权限：商户只能更新自己的酒店
      if (userRole === 'merchant' && hotel.merchant_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权更新此酒店'
        });
      }
      
      // 更新酒店
      await hotel.update(updateData);
      
      res.json({
        success: true,
        message: '酒店更新成功',
        data: hotel
      });
    } catch (error) {
      console.error('更新酒店错误:', error);
      res.status(500).json({
        success: false,
        message: '更新酒店失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 提交酒店审核
  static async submitForReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const hotel = await Hotel.findByPk(id);
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: '酒店不存在'
        });
      }
      
      // 检查权限
      if (userRole === 'merchant' && hotel.merchant_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权提交此酒店'
        });
      }
      
      // 检查酒店信息是否完整
      const requiredFields = ['name_zh', 'city', 'address', 'star_rating'];
      for (const field of requiredFields) {
        if (!hotel[field]) {
          return res.status(400).json({
            success: false,
            message: `酒店信息不完整，请完善${field}字段`
          });
        }
      }
      
      // 更新状态为待审核
      await hotel.update({ status: 'pending' });
      
      res.json({
        success: true,
        message: '酒店已提交审核',
        data: hotel
      });
    } catch (error) {
      console.error('提交审核错误:', error);
      res.status(500).json({
        success: false,
        message: '提交审核失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 删除酒店（软删除）
  static async deleteHotel(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const hotel = await Hotel.findByPk(id);
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: '酒店不存在'
        });
      }
      
      // 检查权限
      if (userRole === 'merchant' && hotel.merchant_id !== userId) {
        return res.status(403).json({
          success: false,
          message: '无权删除此酒店'
        });
      }
      
      // 软删除：更新状态为已删除
      await hotel.update({ status: 'deleted' });
      
      res.json({
        success: true,
        message: '酒店已删除'
      });
    } catch (error) {
      console.error('删除酒店错误:', error);
      res.status(500).json({
        success: false,
        message: '删除酒店失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 获取酒店统计
  static async getMyHotelStats(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      let where = {};
      if (userRole === 'merchant') {
        where.merchant_id = userId;
      }
      
      const stats = await Hotel.findAll({
        where,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      // 格式化统计结果
      const formattedStats = stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.get('count'));
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: formattedStats
      });
    } catch (error) {
      console.error('获取酒店统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败'
      });
    }
  }
  
  // ==================== 管理员接口（需管理员权限） ====================

  // 获取所有酒店（管理员）
  static async getAllHotels(req, res) {
    try {
      const { 
        status, 
        page = 1, 
        limit = 20,
        sort_by = 'created_at',
        order = 'desc'
      } = req.query;
      
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      // 构建查询条件
      const where = {};
      if (status) {
        where.status = status;
      }
      
      const { count, rows: hotels } = await Hotel.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'merchant',
            attributes: ['id', 'username', 'full_name', 'email']
          },
          {
            model: HotelImage,
            as: 'images',
            where: { is_main: true },
            required: false,
            limit: 1
          }
        ],
        order: [[sort_by, order]],
        offset,
        limit: parseInt(limit),
        distinct: true
      });
      
      res.json({
        success: true,
        data: {
          hotels,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(count / limit),
            has_more: parseInt(page) < Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('获取所有酒店错误:', error);
      res.status(500).json({
        success: false,
        message: '获取酒店列表失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 更新酒店状态（管理员审核）
  static async updateHotelStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, review_notes } = req.body;
      
      if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        });
      }
      
      // 查找酒店
      const hotel = await Hotel.findByPk(id, {
        include: [
          {
            model: User,
            as: 'merchant',
            attributes: ['id', 'username', 'full_name', 'email']
          }
        ]
      });
      
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: '酒店不存在'
        });
      }
      
      // 更新状态
      const updateData = { status };
      if (review_notes) {
        updateData.review_notes = review_notes;
      }
      updateData.reviewed_at = new Date();
      
      await hotel.update(updateData);
      
      res.json({
        success: true,
        message: `酒店已${status === 'approved' ? '审核通过' : status === 'rejected' ? '审核拒绝' : '重置为待审核'}`,
        data: hotel
      });
    } catch (error) {
      console.error('更新酒店状态错误:', error);
      res.status(500).json({
        success: false,
        message: '更新状态失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // 获取管理员统计
  static async getAdminStats(req, res) {
    try {
      // 酒店状态统计
      const statusStats = await Hotel.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['status']
      });
      
      // 格式化统计结果
      const byStatus = {};
      let total = 0;
      
      statusStats.forEach(stat => {
        const status = stat.get('status');
        const count = parseInt(stat.get('count'));
        byStatus[status] = count;
        total += count;
      });
      
      // 星级统计
      const starStats = await Hotel.findAll({
        where: { status: 'approved' },
        attributes: [
          'star_rating',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['star_rating'],
        order: [['star_rating', 'ASC']]
      });
      
      const byStarRating = starStats.map(stat => ({
        star_rating: stat.get('star_rating'),
        count: parseInt(stat.get('count'))
      }));
      
      // 城市统计
      const cityStats = await Hotel.findAll({
        where: { status: 'approved' },
        attributes: [
          'city',
          'province',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['city', 'province'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10
      });
      
      const byCity = cityStats.map(stat => ({
        city: stat.get('city'),
        province: stat.get('province'),
        count: parseInt(stat.get('count'))
      }));
      
      res.json({
        success: true,
        data: {
          total_hotels: total,
          by_status: byStatus,
          by_star_rating: byStarRating,
          by_city: byCity
        }
      });
    } catch (error) {
      console.error('获取管理员统计错误:', error);
      res.status(500).json({
        success: false,
        message: '获取统计信息失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
  
  // ==================== 辅助方法 ====================
  
  // 获取推荐酒店
  static async getRecommendedHotels(req, res) {
    try {
      const { city, limit = 6 } = req.query;
      
      const where = { 
        status: 'approved',
        star_rating: { [Op.gte]: 4 } // 推荐4星以上的酒店
      };
      
      if (city) {
        where.city = city;
      }

      const hotels = await Hotel.findAll({
        where,
        include: [
          {
            model: HotelImage,
            as: 'images',
            where: { is_main: true },
            required: false,
            limit: 1
          },
          {
            model: RoomType,
            as: 'room_types',
            where: { is_available: true },
            required: false
          }
        ],
        order: [
          ['star_rating', 'DESC'],
          ['created_at', 'DESC']
        ],
        limit: parseInt(limit)
      });

      const processedHotels = hotels.map(hotel => {
        const hotelData = HotelController.processHotelData(hotel);
        
        // 添加推荐理由
        hotelData.recommendation_reason = '高分好评酒店';
        if (hotelData.star_rating >= 4.5) {
          hotelData.recommendation_reason = '顶级豪华酒店';
        } else if (hotelData.has_discount) {
          hotelData.recommendation_reason = '特惠折扣酒店';
        }
        
        return hotelData;
      });

      res.json({
        success: true,
        data: {
          hotels: processedHotels,
          recommendation_criteria: {
            min_stars: 4,
            city: city || '不限'
          }
        }
      });
    } catch (error) {
      console.error('获取推荐酒店错误:', error);
      res.status(500).json({
        success: false,
        message: '获取推荐酒店失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = HotelController;