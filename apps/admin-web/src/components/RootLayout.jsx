import React from 'react';
import { Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// 根布局：提供 Ant Design 上下文，确保内容区域有最小高度
const RootLayout = () => {
  return (
    <ConfigProvider>
      <div style={{ minHeight: '100vh', width: '100%' }}>
        <Outlet />
      </div>
    </ConfigProvider>
  );
};

export default RootLayout;
