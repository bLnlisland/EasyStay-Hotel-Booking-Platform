// src/constants/facilities.js

export const FACILITY_DICT = [
  { id: "wifi", name: "免费WiFi" },
  { id: "parking", name: "停车场" },
  { id: "pool", name: "游泳池" },
  { id: "gym", name: "健身房" },
  { id: "spa", name: "水疗中心" },
  { id: "restaurant", name: "餐厅" },
  { id: "bar", name: "酒吧" },
  { id: "breakfast", name: "免费早餐" },
  { id: "airport_shuttle", name: "机场接送" },
  { id: "meeting_rooms", name: "会议室" },
  { id: "business_center", name: "商务中心" },
  { id: "laundry", name: "洗衣服务" },
  { id: "room_service", name: "客房服务" },
  { id: "concierge", name: "礼宾服务" },
  { id: "family_rooms", name: "家庭房" },
  { id: "non_smoking", name: "无烟房" },
  { id: "pet_friendly", name: "宠物友好" },
  { id: "accessible", name: "无障碍设施" }
];

// id -> 中文名 映射
export const FACILITY_NAME_BY_ID = Object.fromEntries(
  FACILITY_DICT.map((item) => [item.id, item.name])
);