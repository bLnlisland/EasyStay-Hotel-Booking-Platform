import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

// 创建 axios 实例，指向你的后端地址
const request = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 登录接口（根据实际后端接口修改）
const login = async (username, password) => {
  return request.post('/auth/login', { username, password });
};

// 获取当前用户信息接口
const getCurrentUserProfile = async () => {
  return request.get('/auth/profile', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
  });
};

const Login = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/';
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      if (!values.username || !values.password) {
        message.error('账号和密码不能为空！');
        return;
      }

      // 1. 调用后端登录接口
      const loginRes = await login(values.username, values.password);
      if (!loginRes.data.success) {
        message.error(loginRes.data.message || '登录失败！');
        return;
      }

      const { token } = loginRes.data.data;
      localStorage.setItem('token', token);

      // 2. 调用 /api/auth/profile 获取用户信息
      const profileRes = await getCurrentUserProfile();
      if (!profileRes.data.success) {
        message.error(profileRes.data.message || '获取用户信息失败！');
        return;
      }

      const userInfo = profileRes.data.data;
      const userRole = userInfo.role || 'merchant';

      // 3. 保存用户信息到本地
      localStorage.setItem('role', userRole);
      localStorage.setItem('currentUser', JSON.stringify({
        id: userInfo.id,
        username: userInfo.username,
        email: userInfo.email,
        role: userRole,
        full_name: userInfo.full_name,
        phone: userInfo.phone,
        token: token,
      }));

      message.success(`${userRole === 'admin' || userRole === 'superadmin' ? '管理员' : '商户'}登录成功！`);

      // 4. 根据角色跳转对应首页
      setTimeout(() => {
        const targetPath = from === '/login' || from === '/' 
          ? (userRole === 'admin' || userRole === 'superadmin' ? '/manager/home' : '/merchant/home') 
          : from;
        window.location.replace(targetPath);
      }, 800);
    } catch (error) {
      console.error('登录错误：', error);
      const errMsg = error.response?.data?.message || '登录失败，请稍后重试！';
      message.error(errMsg);
    } finally {
      setLoading(false);
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
            loading={loading}
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