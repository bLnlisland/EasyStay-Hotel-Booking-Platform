import axios from 'axios';

// 1. 基础配置：统一根URL，避免路径拼接错误
const BASE_URL = 'http://localhost:3000'; // 根域名，所有接口都基于这个地址
const service = axios.create({
  baseURL: BASE_URL, // 统一根URL，后续接口只需写相对路径
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2. 请求拦截器：添加Bearer Token认证（保留你的核心逻辑）
service.interceptors.request.use(
  (config) => {
    // 仅浏览器环境读取token
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hotel_token');
      // 🔥 关键修复：先确保 headers 存在，再添加 token
      if (token) {
        // 如果 headers 不存在，先初始化空对象
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. 响应拦截器：保留核心逻辑 + 优化状态码处理
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 兼容两种成功判断：code=200 或 success=true
    if (res.code === 200 || res.success) {
      // 201状态码（创建成功）单独提示
      if (response.status === 201) {
        alert(res.msg || res.message || '创建成功');
      }
      return res;
    } else {
      // 失败提示（兼容msg/message字段）
      const errorMsg = res.msg || res.message || '请求失败';
      alert(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }
  },
  (error) => {
    // 细化错误提示（保留你的逻辑，优化字段兼容）
    let errorMsg = '网络错误，请检查后重试';
    if (error.response) {
      const status = error.response.status;
      const resData = error.response.data;
      
      switch (status) {
        case 400:
          errorMsg = '请求参数错误';
          // 兼容后端返回的错误详情格式
          const errDetail = resData?.errors || resData?.msg || resData?.message;
          if (errDetail) {
            errorMsg = `${errorMsg}：${typeof errDetail === 'string' ? errDetail : (Array.isArray(errDetail) ? errDetail.join('；') : JSON.stringify(errDetail))}`;
          }
          break;
        case 401:
          errorMsg = '未认证，请重新登录';
          // 清除token并跳登录页（优化路径判断）
          if (typeof window !== 'undefined') {
            localStorage.removeItem('hotel_token');
            const currentPath = window.location.pathname;
            if (currentPath !== '/login' && !currentPath.includes('/merchant/login')) {
              window.location.href = '/login'; // 跳转到登录页
            }
          }
          break;
        case 403:
          errorMsg = '权限不足，无法操作';
          break;
        case 404:
          errorMsg = '请求的资源不存在';
          break;
        case 500:
          errorMsg = '服务器内部错误，请稍后重试';
          break;
        default:
          errorMsg = resData?.msg || resData?.message || `请求失败（${status}）`;
      }
    }
    alert(errorMsg);
    return Promise.reject(error);
  }
);

// 4. 封装业务接口：避免重复拼接路径，提高可维护性
// 认证相关接口
export const authApi = {
  // 登录：POST /api/auth/login
  login: (data) => service.post('/api/auth/login', data),
  // 登出：POST /api/auth/logout
  logout: () => service.post('/api/auth/logout'),
  // 获取用户信息：GET /api/auth/me
  getUserInfo: () => service.get('/api/auth/profile')
};

// 酒店相关接口
export const hotelApi = {
  // 获取商户自己的酒店列表：GET /api/hotels/my
  getMyHotels: () => service.get('/api/hotels/my'),
  // 创建酒店：POST /api/hotels
  createHotel: (data) => service.post('/api/hotels', data),
  // 获取当前商户的单个酒店详情（含房型，用于编辑）：GET /api/hotels/{id}
  getHotelDetail: (id) => service.get(`/api/hotels/${id}`),
  // 更新酒店：PUT /api/hotels/{id}
  updateHotel: (id, data) => service.put(`/api/hotels/${id}`, data),
  // 删除酒店：DELETE /api/hotels/{id}
  deleteHotel: (id) => service.delete(`/api/hotels/${id}`),
  // 提交审核：POST /api/hotels/{id}/submit
  submitForReview: (id) => service.post(`/api/hotels/${id}/submit`)
};

// 导出基础service和封装后的接口
export default service;