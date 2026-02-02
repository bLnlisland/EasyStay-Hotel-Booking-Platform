// 封装Axios，团队所有接口都用这个请求
import axios from 'axios';

// 创建Axios实例
const service = axios.create({
  baseURL: '', // 后续后端同学给了接口基础地址，直接填这里（如http://localhost:3001）
  timeout: 5000, // 请求超时时间5秒
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
});

// 请求拦截器（添加token，后续登录后用）
service.interceptors.request.use(
  (config) => {
    // 从本地存储获取token，有则添加到请求头
    const token = localStorage.getItem('token');
    if (token) config.headers.token = token;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器（统一处理错误）
service.interceptors.response.use(
  (response) => {
    const res = response.data;
    // 简单判断请求成功（后续可按后端返回格式修改）
    if (res.code === 200 || res.success) {
      return res;
    } else {
      // 失败提示（后续用AntD的Message）
      alert(res.msg || '请求失败');
      return Promise.reject(new Error(res.msg || '请求失败'));
    }
  },
  (error) => {
    alert('网络错误，请检查后重试');
    return Promise.reject(error);
  }
);

// 导出封装的Axios，团队其他同学直接引入使用
export default service;