import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// 🔴 核心：路由守卫组件（控制角色访问权限）
const PrivateRoute = ({ children, requiredRole }) => {
  // 获取当前路由位置（用于登录后返回原页面）
  const location = useLocation();
  
  // 1. 优先从currentUser读取完整用户信息（最可靠）
  const currentUserStr = localStorage.getItem('currentUser');
  let currentRole = null;
  let token = localStorage.getItem('hotel_token');

  // 2. 解析用户信息，做多层兜底
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      currentRole = currentUser.role; // 从完整用户信息取角色
      token = token || currentUser.token; // 兜底获取token
    } catch (e) {
      console.error('解析currentUser失败：', e);
    }
  }

  // 3. 兜底逻辑：如果currentUser解析失败，读单独的role字段
  if (!currentRole) {
    currentRole = localStorage.getItem('role') || null;
  }

  // ========== 核心鉴权逻辑 ==========
  // 1. 未登录（无token/无角色）→ 强制跳登录页，并记录来源地址
  if (!token || !currentRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. 角色不匹配 → 跳对应角色的首页（防止越权访问）
  if (requiredRole && currentRole !== requiredRole) {
    const redirectPath = currentRole === 'admin' 
      ? '/manager/home' 
      : '/merchant/home';
    return <Navigate to={redirectPath} replace />;
  }

  // 3. 权限校验通过 → 正常渲染页面
  return children;
};

export default PrivateRoute;