// src/hooks/useAmapCity.js

import { reverseGeocodeToCity, normalizeCity } from "../utils/amap";

export function useAmapCity() {
  async function locateToPatch(existingCity) {
    if (!navigator.geolocation) throw new Error("当前浏览器不支持定位");

    const pos = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    const { latitude, longitude } = pos.coords;

    let city = "";
    try {
      const rawCity = await reverseGeocodeToCity(latitude, longitude);
      city = normalizeCity(rawCity);
    } catch {
      // 城市解析失败也没关系，lat/lng 仍然返回
      city = "";
    }

    return {
      lat: latitude,
      lng: longitude,
      // 如果用户手动填了 city，就不覆盖
      city: existingCity ? existingCity : city,
    };
  }

  return { locateToPatch };
}