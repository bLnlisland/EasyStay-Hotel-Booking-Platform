import React from 'react';
import { Button, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LogoutOutlined } from '@ant-design/icons';

const UserHome = () => {
  const navigate = useNavigate();

  const toLogin = () => navigate('/');

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div className="app-page-title-wrap">
          <div className="app-page-icon">🔍</div>
          <div>
            <h1 className="app-page-title">酒店预订系统 · 用户端</h1>
            <p className="app-page-subtitle">后续在这里开发：酒店搜索 / 筛选 / 列表展示</p>
          </div>
        </div>
      </div>

      <Card className="app-card" bordered={false} style={{ padding: '28px 24px' }}>
        <Button size="large" danger icon={<LogoutOutlined />} onClick={toLogin}>
          退出登录
        </Button>
      </Card>
    </div>
  );
};

export default UserHome;
