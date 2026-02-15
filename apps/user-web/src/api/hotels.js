import { http } from './http'

// 获取酒店列表（用户端）
export function fetchHotels(params) {
  return http.get('/hotels/public', { params })
}

// 获取酒店详情（前端日期纯展示：自动过滤掉 check_in/check_out）
export function fetchHotelDetail(id, params = {}) {
  const { check_in, check_out, ...safe } = params || {};
  return http.get(`/hotels/public/${id}`, { params: safe });
}
