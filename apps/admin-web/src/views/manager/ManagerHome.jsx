// 管理端首页（你的专属首页，后续开发功能入口）
import React from 'react';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom'; // 路由跳转钩子

const ManagerHome = () => {
  const navigate = useNavigate();
  // 跳回登录页
  const toLogin = () => navigate('/');
  return (
    <div style={{ margin: 50 }}>
      <h1>欢迎进入管理端后台</h1>
      <p>后续在这里开发：酒店录入/审核/上下线功能入口</p>
      <Button type="primary" onClick={toLogin}>退出登录</Button>
    </div>
  );
};

export default ManagerHome;