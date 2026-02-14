import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

// 核心修复：使用React.memo包裹，避免重复渲染
const Login = React.memo(() => {
  const location = useLocation();
  const from = location.state?.from?.pathname || '/'; // 记录来源地址

  const getRegisteredUsers = () => {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
  };

  const handleSubmit = (values) => {
    try {
      if (!values.username || !values.password) {
        message.error('账号和密码不能为空！');
        return;
      }

      const registeredUsers = getRegisteredUsers();
      const user = registeredUsers.find(item => item.username === values.username);
      
      if (!user) {
        message.error('此账号不存在，请先注册！');
        return;
      }

      if (user.password !== values.password) {
        message.error('密码错误，请重新输入！');
        return;
      }

      const userRole = user.role || 'merchant';
      localStorage.setItem('role', userRole);
      localStorage.setItem('currentUser', JSON.stringify({
        username: user.username,
        role: userRole,
        token: `${userRole}_token_${Date.now()}`
      }));
      
      message.success(`${userRole === 'admin' ? '管理员' : '商户'}登录成功！`);
      setTimeout(() => {
        // 优先跳来源页，否则跳角色首页
        const targetPath = from === '/login' || from === '/' 
          ? (userRole === 'admin' ? '/manager/home' : '/merchant/home') 
          : from;
        // 使用 window.location 强制刷新，避免 createBrowserRouter 下 navigate 后页面不渲染的问题
        window.location.replace(targetPath);
      }, 800);
    } catch (error) {
      message.error('登录失败，请稍后重试！');
      console.error('登录错误：', error);
    }
  };

  return (
    <div style={{ 
      maxWidth: '380px', 
      margin: '80px auto', 
      padding: '30px', 
      border: '1px solid #e8e8e8', 
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '30px', 
        color: '#1677ff',
        fontWeight: 600 
      }}>系统统一登录</h2>

      <Form
        name="system-login"
        autoComplete="off"
        onFinish={handleSubmit}
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 18 }}
      >
        <Form.Item
          name="username"
          label="账号"
          rules={[{ required: true, message: '请输入登录账号' }]}
        >
          <Input 
            prefix={<UserOutlined style={{ color: '#1677ff' }} />} 
            placeholder="请输入账号" 
            maxLength={20}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入登录密码' },
            { min: 6, message: '密码长度不能少于6位！' },
          ]}
        >
          <Input.Password 
            prefix={<LockOutlined style={{ color: '#1677ff' }} />} 
            placeholder="请输入密码" 
            maxLength={20}
          />
        </Form.Item>

        <Form.Item wrapperCol={{ span: 24 }} style={{ marginTop: '20px' }}>
          <Button 
            type="primary" 
            htmlType="submit" 
            style={{ 
              width: '100%', 
              backgroundColor: '#1677ff', 
              borderColor: '#1677ff',
              height: '40px',
              fontSize: '16px'
            }}
          >
            登录
          </Button>
        </Form.Item>

        <Form.Item style={{ textAlign: 'center', marginBottom: 0, wrapperCol: { span: 24 } }}>
          <Link to="/register" style={{ color: '#1677ff', fontSize: '14px' }}>
            还没有账号？立即注册
          </Link>
        </Form.Item>
      </Form>
    </div>
  );
});

export default Login;