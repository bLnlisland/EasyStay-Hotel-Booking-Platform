import React from 'react';
import { Button, Modal } from 'antd'; // 改用Modal.confirm（antd 5.x）
import { Link, useNavigate } from 'react-router-dom';

const ServerHome = () => {
  const navigate = useNavigate();

  // 商户退出登录（只清登录状态，保留业务数据）
  const handleLogout = () => {
    Modal.confirm({
      title: '确认退出',
      content: '确定要退出登录吗？您的商户数据会被保留',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        try {
          // ✅ 只清除登录状态相关（核心修改）
          localStorage.removeItem('role');       // 角色标识
          localStorage.removeItem('currentUser');// 当前登录用户
          localStorage.removeItem('token');      // 登录令牌（如有）
          
          // ❌ 不清除以下业务数据
          // localStorage.removeItem('registeredUsers'); // 保留注册数据
          // localStorage.removeItem('hotelList');       // 保留酒店数据（如有）

          // 跳登录页，防止回退
          navigate('/', { replace: true });
          Modal.success({ content: '退出成功，您的商户数据已保留！' });
        } catch (error) {
          console.error('退出登录失败：', error);
          window.location.href = '/'; // 兜底跳转
        }
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>酒店预订系统-商户端</h1>
      <p>欢迎回来，您可以在这里管理您的酒店信息</p>

      <div style={{ marginTop: '30px' }}>
        <Link to="/server/hotel-add">
          <Button type="primary" size="large" style={{ marginRight: '16px' }}>
            录入酒店信息
          </Button>
        </Link>
        <Link to="/server/hotel-list">
          <Button type="default" size="large" style={{ marginLeft: '16px' }}>
            我的酒店列表
          </Button>
        </Link>
      </div>
      <div style={{ marginTop: '16px' }}>
        <Button 
          onClick={handleLogout} 
          size="large"
          danger
        >
          退出登录
        </Button>
      </div>  
    </div>
  );
};

export default ServerHome;