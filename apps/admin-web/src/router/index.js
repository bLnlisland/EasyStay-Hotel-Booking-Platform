import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useLocation,useNavigate } from 'react-router-dom';
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

// 🔴 优化版路由守卫：增加Token校验 + 更健壮的逻辑
const PrivateRoute = ({ children, requiredRole }) => {
  const location = useLocation();
  
  // 1. 核心：同时校验Token和角色（双重保障）
  const token = localStorage.getItem('token');
  let currentRole = localStorage.getItem('role');
  const currentUserStr = localStorage.getItem('currentUser');

  // 2. 优先从currentUser解析角色（兜底逻辑）
  if (!currentRole && currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      currentRole = currentUser.role;
    } catch (e) {
      console.error('解析用户信息失败：', e);
      currentRole = null;
    }
  }

  // 3. 未登录（无Token/无角色）→ 跳登录页，携带来源地址
  if (!token || !currentRole) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 4. 角色不匹配 → 跳对应角色首页（防止越权）
  if (requiredRole && currentRole !== requiredRole) {
    const redirectPath = currentRole === 'admin' ? '/manager/home' : '/merchant/home';
    return <Navigate to={redirectPath} replace />;
  }

  // 5. 权限通过 → 渲染页面
  return children;
};

// 📌 封装带守卫的页面组件（统一管理，易维护）
// 管理员页面
const AdminHomeWrapper = () => <PrivateRoute requiredRole="admin"><ManagerHome /></PrivateRoute>;
const HotelAuditWrapper = () => <PrivateRoute requiredRole="admin"><HotelAuditList /></PrivateRoute>;
const HotelAuditDetailWrapper = () => <PrivateRoute requiredRole="admin"><HotelAuditDetail /></PrivateRoute>;

// 商户页面
const MerchantHomeWrapper = () => <PrivateRoute requiredRole="merchant"><MerchantHome /></PrivateRoute>;
const HotelListWrapper = () => <PrivateRoute requiredRole="merchant"><HotelList /></PrivateRoute>;
const HotelAddWrapper = () => <PrivateRoute requiredRole="merchant"><HotelAdd /></PrivateRoute>;
const HotelEditWrapper = () => <PrivateRoute requiredRole="merchant"><HotelEdit /></PrivateRoute>;

// 🔧 通用404页面（优化样式 + 路由跳转）
const ErrorPage = () => {
  const navigate = useNavigate(); // 改用react-router跳转，避免刷新

  return (
    <div style={{ 
      padding: '40px 20px', 
      textAlign: 'center', 
      marginTop: '80px',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto'
    }}>
      <h1 style={{ color: '#ff4d4f', fontSize: '48px', marginBottom: '20px' }}>404</h1>
      <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px', lineHeight: '1.6' }}>
        您访问的页面不存在，请检查地址是否正确，或返回首页继续操作
      </p>
      <button 
        style={{ 
          padding: '10px 24px', 
          background: '#1890ff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'background 0.2s'
        }}
        onClick={() => navigate('/')} // 改用react-router的navigate，更符合单页应用
        onMouseEnter={(e) => e.target.style.background = '#40a9ff'}
        onMouseLeave={(e) => e.target.style.background = '#1890ff'}
      >
        返回首页
      </button>
    </div>
  );
};

// 🚀 路由配置（优化结构 + 增加注释 + 修复逻辑）
const routesConfig = [
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorFallback />,
    children: [
      // 公开路由（无需登录）
      { index: true, element: <Navigate to="/login" replace /> }, // 根路径直接跳登录
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },

      // 管理员专属路由（需admin角色）
      { path: 'manager/home', element: <AdminHomeWrapper /> },
      { path: 'manager/hotel-audit', element: <HotelAuditWrapper /> },
      { path: 'manager/hotel-audit/:id', element: <HotelAuditDetailWrapper /> },

      // 商户专属路由（需merchant角色）
      { path: 'merchant/home', element: <MerchantHomeWrapper /> },
      { path: 'merchant/hotel-list', element: <HotelListWrapper /> },
      { path: 'merchant/hotel-add', element: <HotelAddWrapper /> },
      { path: 'merchant/hotel-edit/:id', element: <HotelEditWrapper /> },

      // 备用用户路由（可根据需求加守卫）
      { 
        path: 'user/home', 
        element: <PrivateRoute><UserHome /></PrivateRoute> // 仅需登录，不限制角色
      },

      // 404路由（必须放在最后）
      { path: '*', element: <ErrorPage /> }
    ]
  }
];

// 🛠️ 创建路由实例（优化配置）
const router = createBrowserRouter(routesConfig, {
  basename: '/',
  scrollRestoration: 'top', // 跳转时自动滚动到顶部（更友好）
  // 新增：路由跳转错误处理
  future: {
    v7_relativeSplatPath: true, // 兼容未来版本
    v7_prependBasename: true,
  }
});

// 🎯 路由根组件（优化加载提示）
function AppRouter() {
  return (
    <RouterProvider 
      router={router} 
      fallbackElement={
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          color: '#1890ff'
        }}>
          <div>
            <div style={{ marginBottom: '10px' }}>🚀 系统加载中...</div>
            <div style={{ fontSize: '14px', color: '#666' }}>请稍候</div>
          </div>
        </div>
      } 
    />
  );
}

// 导出（保持原有导出方式，兼容旧代码）
export { router, AppRouter };
export default AppRouter;