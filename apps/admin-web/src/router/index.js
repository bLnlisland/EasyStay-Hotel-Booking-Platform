import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation } from 'react-router-dom';
import RootLayout from '../components/RootLayout';
import ErrorFallback from '../components/ErrorFallback';
// 引入页面组件
import Login from '../views/login/Login'; 
import Register from '../views/register/Register'; 
import ManagerHome from '../views/manager/ManagerHome'; 
import HotelAuditList from '../views/manager/HotelAuditList'; 
import HotelAuditDetail from '../views/manager/HotelAuditDetail';
import MerchantHome from '../views/merchant/MerchantHome'; 
import HotelList from '../views/merchant/HotelList'; 
import HotelAdd from '../views/merchant/HotelAdd'; 
import HotelEdit from '../views/merchant/HotelEdit'; 
import UserHome from '../views/user/UserHome'; 

// 🔴 路由守卫：精简逻辑，保留核心功能
const PrivateRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  // 核心：优先读取role，兜底解析currentUser
  let currentRole = localStorage.getItem('role');
  const currentUserStr = localStorage.getItem('currentUser');
  
  if (!currentRole && currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      currentRole = currentUser.role;
    } catch (e) {
      currentRole = null;
    }
  }

  // 未登录 → 跳登录页（带跳转前地址）
  if (!currentRole) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 角色不匹配 → 跳对应首页
  if (currentRole !== requiredRole) {
    const redirectPath = currentRole === 'admin' ? '/manager/home' : '/merchant/home';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// 封装带守卫的组件（保持简洁）
const AdminHomeWrapper = () => <PrivateRoute requiredRole="admin"><ManagerHome /></PrivateRoute>;
const HotelAuditWrapper = () => <PrivateRoute requiredRole="admin"><HotelAuditList /></PrivateRoute>;
// 🔥 新增：审核详情页的路由守卫封装
const HotelAuditDetailWrapper = () => <PrivateRoute requiredRole="admin"><HotelAuditDetail /></PrivateRoute>;

const MerchantHomeWrapper = () => <PrivateRoute requiredRole="merchant"><MerchantHome /></PrivateRoute>;
const HotelListWrapper = () => <PrivateRoute requiredRole="merchant"><HotelList /></PrivateRoute>;
const HotelAddWrapper = () => <PrivateRoute requiredRole="merchant"><HotelAdd /></PrivateRoute>;
const HotelEditWrapper = () => <PrivateRoute requiredRole="merchant"><HotelEdit /></PrivateRoute>;

// 404页面
const ErrorPage = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center', marginTop: '100px' }}>
      <h1 style={{ color: '#ff4d4f', fontSize: '32px' }}>404 页面找不到</h1>
      <p style={{ color: '#666', marginTop: '20px' }}>您访问的页面不存在，请检查地址或返回首页</p>
      <button 
        style={{ 
          marginTop: '20px', 
          padding: '8px 16px', 
          background: '#1890ff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        onClick={() => window.location.href = '/'}
      >
        返回首页
      </button>
    </div>
  );
};

// 路由配置：使用根布局包裹，确保 Ant Design 和布局正确渲染
const routesConfig = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorFallback />,
    children: [
      { index: true, element: <Login /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      // 管理员路由
      { path: 'manager/home', element: <AdminHomeWrapper /> },
      { path: 'manager/hotel-audit', element: <HotelAuditWrapper /> },
      { path: 'manager/hotel-audit/:id', element: <HotelAuditDetailWrapper /> },
      // 商户路由
      { path: 'merchant/home', element: <MerchantHomeWrapper /> },
      { path: 'merchant/hotel-list', element: <HotelListWrapper /> },
      { path: 'merchant/hotel-add', element: <HotelAddWrapper /> },
      { path: 'merchant/hotel-edit/:id', element: <HotelEditWrapper /> },
      // 备用路由
      { path: 'user/home', element: <UserHome /> },
      // 404（必须最后）
      { path: '*', element: <ErrorPage /> }
    ]
  }
];

// 创建路由实例
const router = createBrowserRouter(routesConfig, {
  // 新增：配置basename（如果部署在子路径下，比如/manager，需修改）
  basename: '/',
  // 新增：路由跳转时滚动到顶部
  scrollRestoration: 'manual'
});

// 路由根组件
function AppRouter() {
  return (
    <RouterProvider 
      router={router} 
      fallbackElement={
        <div style={{ 
          textAlign: 'center', 
          padding: '50px',
          fontSize: '16px',
          color: '#666'
        }}>
          页面加载中...
        </div>
      } 
    />
  );
}

// 导出（保持兼容）
export { router, AppRouter };
export default AppRouter;