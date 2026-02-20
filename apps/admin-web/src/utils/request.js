import axios from 'axios';

// 1. 基础配置：开发环境走代理同源请求，避免跨域/上传报网络错误
const isDevProxy = typeof window !== 'undefined' && window.location.port === '3001';
const API_BASE = isDevProxy ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3000');
export const BASE_URL = isDevProxy ? '' : (process.env.REACT_APP_API_URL || 'http://localhost:3000'); // 图片同源时用空（走代理）
const service = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2. 请求拦截器：Token + FormData 时去掉 Content-Type 让浏览器自动带 boundary
service.interceptors.request.use(
  (config) => {
    if (config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('hotel_token');
      if (token) {
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
        case 401: {
          const isLoginRequest = (error.config?.url || '').includes('/auth/login');
          if (isLoginRequest) {
            // 登录接口 401：用户名或密码错误，不跳转、不清 token，由登录页展示错误
            errorMsg = resData?.message || '用户名或密码错误';
          } else {
            errorMsg = '未认证，请重新登录';
            if (typeof window !== 'undefined') {
              localStorage.removeItem('hotel_token');
              localStorage.removeItem('role');
              localStorage.removeItem('currentUser');
              const currentPath = window.location.pathname;
              if (currentPath !== '/login' && !currentPath.includes('/merchant/login')) {
                window.location.href = '/login';
              }
            }
          }
          break;
        }
        case 403:
          errorMsg = '权限不足，无法操作';
          break;
        case 404:
          errorMsg = '请求的资源不存在';
          break;
        case 500:
          errorMsg = resData?.message || '服务器内部错误，请稍后重试';
          break;
        default:
          errorMsg = resData?.msg || resData?.message || `请求失败（${status}）`;
      }
    }
    const isLoginReq = error.config?.url?.includes('/auth/login');
    if (!isLoginReq) {
      alert(errorMsg);
    }
    return Promise.reject(new Error(errorMsg));
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
  // 管理员获取所有酒店：GET /api/hotels/admin/all?status=&page=1&limit=20
  getAdminAllHotels: (params) => service.get('/api/hotels/admin/all', { params }),
  // 管理员获取单个酒店详情（审核页）：GET /api/hotels/admin/:id
  getAdminHotelDetail: (id) => service.get(`/api/hotels/admin/${id}`),
  // 管理员更新酒店状态（审核）：PUT /api/hotels/admin/:id/status
  updateAdminHotelStatus: (id, data) => service.put(`/api/hotels/admin/${id}/status`, data),
  // 管理员设置酒店上下线（发布）：PUT /api/hotels/admin/:id/publish
  updateAdminHotelPublish: (id, data) => service.put(`/api/hotels/admin/${id}/publish`, data),
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
  submitForReview: (id) => service.post(`/api/hotels/${id}/submit`),
  // 酒店图片：GET /api/hotels/:id/images
  getHotelImages: (hotelId) => service.get(`/api/hotels/${hotelId}/images`),
  // 上传酒店图片：POST /api/hotels/:id/images（FormData，不设 Content-Type 以自动带 boundary）
  uploadHotelImages: (hotelId, formData) =>
    service.post(`/api/hotels/${hotelId}/images`, formData),
  // 删除酒店图片：DELETE /api/hotels/:id/images/:imageId
  deleteHotelImage: (hotelId, imageId) => service.delete(`/api/hotels/${hotelId}/images/${imageId}`)
};

// 导出基础service和封装后的接口
export default service;