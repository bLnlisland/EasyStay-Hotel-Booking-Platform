/**
 * 用法：
 * node scripts/seed-15-hotels.js
 *
 * 作用：
 * - 清理旧测试酒店（只清理 merchant1(id=2) 且 name_zh 前缀为 "联调测试酒店-" 的数据）
 * - 创建 15 家酒店（hotels 表字段齐全）
 * - 每家酒店创建 2 个房型（room_types 表字段齐全）
 * - 每家酒店创建 3 张图片（hotel_images 表字段齐全）
 *
 * 备注：
 * - 图片默认引用 /uploads/default-1.png ~ default-3.png
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const db = require("../src/models");
const { sequelize, Sequelize } = db;
const { Op } = Sequelize;

async function main() {
  const merchantId = 2; // ✅ merchant1 的 id

  const { Hotel, RoomType, HotelImage } = db;
  if (!Hotel || !RoomType || !HotelImage) {
    throw new Error("找不到模型：请确保 src/models/index.js 导出了 Hotel/RoomType/HotelImage");
  }

  const cities = [
    { city: "深圳", province: "广东", lat: 22.5431, lng: 114.0579 },
    { city: "广州", province: "广东", lat: 23.1291, lng: 113.2644 },
    { city: "杭州", province: "浙江", lat: 30.2741, lng: 120.1551 },
    { city: "武汉", province: "湖北", lat: 30.5928, lng: 114.3055 },
    { city: "成都", province: "四川", lat: 30.5728, lng: 104.0668 },
  ];

  const hotelFacilitiesPool = ["wifi", "parking", "breakfast", "gym", "pool", "family", "luxury"];

  const roomFacilitiesPool = ["wifi", "breakfast", "aircon", "tv", "shower", "bathtub"];

  const defaultImgs = [
    { url: "/uploads/default-1.png", alt: "酒店大堂", isMain: 1, order: 1 },
    { url: "/uploads/default-2.png", alt: "酒店客房", isMain: 0, order: 2 },
    { url: "/uploads/default-3.png", alt: "酒店外观", isMain: 0, order: 3 },
  ];

  const t = await sequelize.transaction();

  try {
    // 1) 找到旧测试酒店
    const oldHotels = await Hotel.findAll({
      where: {
        merchant_id: merchantId,
        name_zh: { [Op.like]: "联调测试酒店-%" },
      },
      attributes: ["id"],
      transaction: t,
    });

    const oldIds = oldHotels.map((h) => h.id);

    // 2) 删子表 -> 父表
    if (oldIds.length) {
      await HotelImage.destroy({ where: { hotel_id: oldIds }, transaction: t });
      await RoomType.destroy({ where: { hotel_id: oldIds }, transaction: t });
      await Hotel.destroy({ where: { id: oldIds }, transaction: t });
      console.log(`🧹 清理旧测试数据：${oldIds.length} 家酒店`);
    } else {
      console.log("🧹 没有旧测试数据需要清理");
    }

    // 3) 创建 15 家酒店（对齐 hotels 表字段）
    const hotelsPayload = [];
    for (let i = 1; i <= 15; i++) {
      const c = cities[i % cities.length];
      const star = (i % 5) + 1;

      hotelsPayload.push({
        merchant_id: merchantId,
        name_zh: `联调测试酒店-${c.city}-${String(i).padStart(2, "0")}`,
        name_en: null,
        description: "用于联调与验收测试的数据。",
        address: `${c.city}测试大道 ${i} 号`,
        city: c.city,
        province: c.province,
        latitude: Number((c.lat + i * 0.001).toFixed(8)),
        longitude: Number((c.lng + i * 0.001).toFixed(8)),
        star_rating: star,
        opening_year: 2010 + (i % 10),
        facilities: hotelFacilitiesPool.slice(0, (i % hotelFacilitiesPool.length) + 1),
        status: "approved",
        rejection_reason: null,
        contact_phone: "0755-88888888",
        contact_email: `hotel${i}@test.com`,
        check_in_time: "14:00",
        check_out_time: "12:00",
        policy: "支持身份证入住，提供发票。",
        is_online: 1,
        // created_at / updated_at 让 DB 默认即可（避免模型 timestamps 配置不同导致写入失败）
      });
    }

    const createdHotels = await Hotel.bulkCreate(hotelsPayload, { transaction: t });
    console.log(`✅ 创建 hotels：${createdHotels.length} 条`);

    // 4) 创建房型（对齐 room_types 表字段）
    const roomTypesPayload = [];
    for (const h of createdHotels) {
      // 每家两个房型
      roomTypesPayload.push(
        {
          hotel_id: h.id,
          name: "标准间",
          description: "基础房型，适合商务出行",
          area: 25.0,
          max_guests: 2,
          bed_type: "双床",
          facilities: roomFacilitiesPool.slice(0, 4),
          base_price: 299.0,
          discount_rate: 1.0,
          available_count: 20,
          is_available: 1,
        },
        {
          hotel_id: h.id,
          name: "大床房",
          description: "舒适大床房，适合情侣或单人入住",
          area: 28.0,
          max_guests: 2,
          bed_type: "大床",
          facilities: roomFacilitiesPool.slice(0, 5),
          base_price: 399.0,
          discount_rate: 0.9,
          available_count: 15,
          is_available: 1,
        }
      );
    }

    const createdRooms = await RoomType.bulkCreate(roomTypesPayload, { transaction: t });
    console.log(`✅ 创建 room_types：${createdRooms.length} 条`);

    // 5) 创建图片（对齐 hotel_images 表字段：url / alt_text / is_main / order）
    const imagesPayload = [];
    for (const h of createdHotels) {
      for (const img of defaultImgs) {
        imagesPayload.push({
          hotel_id: h.id,
          url: img.url,
          alt_text: img.alt,
          is_main: img.isMain,
          order: img.order,
        });
      }
    }

    const createdImgs = await HotelImage.bulkCreate(imagesPayload, { transaction: t });
    console.log(`✅ 创建 hotel_images：${createdImgs.length} 条`);

    await t.commit();
    console.log("🎉 Seed 完成（酒店+房型+图片+设施 全齐）！");
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error("❌ Seed 失败：", err);
    process.exit(1);
  }
}

main();