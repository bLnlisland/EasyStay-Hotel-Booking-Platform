import React, { useState } from 'react';
import { Form, Input, Button, message, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authApi } from '../../utils/request';

const { Title } = Typography;

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
    <div className="auth-page">
      <Card className="auth-card" bordered={false}>
        <Title level={2} className="auth-title">统一登录</Title>

        <Form
          name="system-login"
          autoComplete="off"
          onFinish={handleSubmit}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label="账号"
            rules={[{ required: true, message: '请输入登录账号' }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: 'var(--primary)' }} />}
              placeholder="请输入账号"
              maxLength={20}
              autoComplete="off"
              size="large"
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
              prefix={<LockOutlined style={{ color: 'var(--primary)' }} />}
              placeholder="请输入密码"
              maxLength={20}
              autoComplete="off"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '24px', marginBottom: '16px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
              className="app-btn-primary"
              style={{ height: 44, fontSize: 16 }}
            >
              登录
            </Button>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'center' }}>
            <Link to="/register" style={{ color: 'var(--primary)', fontSize: 14 }}>
              还没有账号？立即注册
            </Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
});

export default Login;
