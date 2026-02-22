// src/utils/amap.js

// 城市标准化工具函数
export function normalizeCity(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .replace(/\s+/g, "")
    .replace(/(市|地区|特别行政区)$/, "");
}

// CRA：高德逆地理编码（lat/lng -> city）
export async function reverseGeocodeToCity(lat, lng) {
  const key = process.env.REACT_APP_AMAP_KEY;
  if (!key) {
    throw new Error("缺少高德 Key（REACT_APP_AMAP_KEY）");
  }

  const url = new URL("https://restapi.amap.com/v3/geocode/regeo");
  url.searchParams.set("key", key);
  url.searchParams.set("location", `${lng},${lat}`); // 高德是 lng,lat
  url.searchParams.set("output", "JSON");
  url.searchParams.set("extensions", "base");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("逆地理编码请求失败");
  const data = await res.json();

  const ac = data?.regeocode?.addressComponent;
  const city = (Array.isArray(ac?.city) ? "" : ac?.city) || ac?.province || "";

  return city;
}