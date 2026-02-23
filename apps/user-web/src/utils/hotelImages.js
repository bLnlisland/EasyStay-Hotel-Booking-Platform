// src/utils/hotelImages.js
import defaultHotel from "../assets/default-hotel.png";
import { toPublicUrl } from "./publicUrl";

function pickUrl(x) {
  if (!x) return "";
  if (typeof x === "string") return x;
  return x.url || x.image || "";
}

/** 封面图：优先 hotel.image，其次 images[0] */
export function getHotelCover(hotel, fallback = defaultHotel) {
  const raw = pickUrl(hotel?.image) || pickUrl(hotel?.images?.[0]);
  return toPublicUrl(raw) || fallback;
}

/** 轮播图：返回 urls 数组；无图则用 fallback 填充到 count 张 */
export function getHotelCarouselImages(hotel, opts = {}) {
  const { count = 3, fallback = defaultHotel } = opts;

  const rawList = Array.isArray(hotel?.images) ? hotel.images : [];
  const urls = rawList.map(pickUrl).map(toPublicUrl).filter(Boolean);

  if (urls.length) return urls;

  // 没图：填充 count 张默认图，保证 Carousel 不空
  return Array.from({ length: Math.max(1, count) }, () => fallback);
}