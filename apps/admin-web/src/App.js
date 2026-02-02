import React from 'react';
import { RouterProvider } from 'react-router-dom'; // 路由提供者
import router from './router'; // 引入配置好的路由
import 'antd/dist/antd.css'; // 全局引入AntD4样式，团队所有组件都能直接用
import './App.css';

function App() {
  // 路由占位，所有页面都在这里渲染
  return <RouterProvider router={router} />;
}

export default App;