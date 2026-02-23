import React from 'react';
import { Button, Modal, Card } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { PlusOutlined, UnorderedListOutlined, LogoutOutlined } from '@ant-design/icons';

const MerchantHome = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？您的商户数据会被保留',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        try {
          localStorage.removeItem('role');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('hotel_token');
          navigate('/', { replace: true });
          Modal.success({ content: '退出成功，您的商户数据已保留！' });
        } catch (error) {
          console.error('退出登录失败：', error);
          window.location.href = '/';
        }
      }
    });
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div className="app-page-title-wrap">
          <div className="app-page-icon">🏨</div>
          <div>
            <h1 className="app-page-title">酒店预订系统 · 商户端</h1>
            <p className="app-page-subtitle">欢迎回来，您可以在这里管理您的酒店信息</p>
          </div>
        </div>
      </div>

      <Card className="app-card" bordered={false} style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/merchant/hotel-add">
            <Button type="primary" size="large" className="app-btn-primary" icon={<PlusOutlined />}>
              录入酒店信息
            </Button>
          </Link>
          <Link to="/merchant/hotel-list">
            <Button size="large" className="app-btn-default" icon={<UnorderedListOutlined />}>
              我的酒店列表
            </Button>
          </Link>
          <Button size="large" danger icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default MerchantHome;
