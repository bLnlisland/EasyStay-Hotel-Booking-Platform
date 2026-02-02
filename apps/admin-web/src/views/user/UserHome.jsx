// 用户端首页（同学A的专属首页，后续开发酒店搜索/列表）
import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserHome = () => {
  const navigate = useNavigate();
  const toLogin = () => navigate('/');
  return (
    <div style={{ margin: 50 }}>
      <h1>酒店预订系统-用户端</h1>
      <p>后续在这里开发：酒店搜索/筛选/列表展示</p>
      <button onClick={toLogin}>退出登录</button>
    </div>
  );
};

export default UserHome;