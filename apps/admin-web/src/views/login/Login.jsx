import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authApi } from '../../utils/request';

const Login = React.memo(() => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      const loginRes = await authApi.login({
        username: values.username,
        password: values.password
      });

      if (!loginRes || !loginRes.success) {
        message.error(loginRes?.message || '登录失败！');
        return;
      }

      const { user, token } = loginRes.data || {};
      if (!token || !user) {
        message.error('未获取到有效登录信息');
        return;
      }

      const role = String(user.role || '').toLowerCase();
      localStorage.setItem('hotel_token', token);
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('role', role);

      const path = role === 'admin' ? '/manager/home' : '/merchant/home';
      message.success('登录成功！正在跳转…');
      // 延迟跳转，让用户看到“登录成功”提示后再整页跳转
      setTimeout(() => {
        window.location.replace(path);
      }, 800);
      return;
    } catch (error) {
      console.error('登录错误：', error);
      message.error(error?.message || '登录出错，请重试');
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
      }}>统一登录</h2>

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
            autoComplete="off"
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
            autoComplete="off"
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

        <Form.Item style={{ marginBottom: 0, wrapperCol: { span: 24 } }}>
          <div style={{ textAlign: 'center' }}>
            <Link to="/register" style={{ color: '#1677ff', fontSize: '14px' }}>
              还没有账号？立即注册
            </Link>
          </div>
        </Form.Item>
      </Form>
    </div>
  );
});

export default Login;