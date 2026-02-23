import React from 'react';
import { Button, Modal, Card } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { AuditOutlined, LogoutOutlined } from '@ant-design/icons';

const ManagerHome = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出登录',
      content: '确定要退出管理员账号吗？系统所有数据会被保留，再次登录即可继续操作',
      okText: '确认退出',
      cancelText: '取消',
      onOk: () => {
        try {
          localStorage.removeItem('role');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('hotel_token');
          navigate('/', { replace: true });
          Modal.success({ content: '退出登录成功！系统数据已保留', okText: '确定' });
        } catch (error) {
          console.error('管理员退出登录失败：', error);
          window.location.href = '/';
        }
      },
      onCancel: () => {
        Modal.info({ content: '已取消退出登录', okText: '确定' });
      }
    });
  };

  return (
    <div className="app-page">
      <div className="app-page-header">
        <div className="app-page-title-wrap">
          <div className="app-page-icon">📋</div>
          <div>
            <h1 className="app-page-title">酒店预订系统 · 管理端</h1>
            <p className="app-page-subtitle">欢迎回来，您可以在这里审核商户提交的酒店信息</p>
          </div>
        </div>
      </div>

      <Card className="app-card" bordered={false} style={{ padding: '28px 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Link to="/manager/hotel-audit">
            <Button type="primary" size="large" className="app-btn-primary" icon={<AuditOutlined />}>
              进入酒店审核列表
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

export default ManagerHome;
