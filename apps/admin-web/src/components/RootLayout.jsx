import React from 'react';
import { Outlet } from 'react-router-dom';
import { ConfigProvider } from 'antd';

// 统一主题：主色与组件圆角
const theme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
  },
};

const RootLayout = () => {
  return (
    <ConfigProvider theme={theme}>
      <div className="root-layout" style={{ minHeight: '100vh', width: '100%' }}>
        <Outlet />
      </div>
    </ConfigProvider>
  );
};

export default RootLayout;
