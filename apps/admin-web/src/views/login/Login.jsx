import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// 导入全局封装的 request 实例
import { authApi } from '../../utils/request'; 

const Login = React.memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/merchant/home';
  const [loading, setLoading] = useState(false);

const handleSubmit = async (values) => {
  try {
    setLoading(true);

    const loginRes = await authApi.login({
      username: values.username,
      password: values.password
    });

    console.log('📌 登录响应：', loginRes);

    // ✅ 正确判断：直接从 loginRes 里取 success
    if (!loginRes.success) {
      message.error(loginRes.message || '登录失败！');
      return;
    }

    // ✅ 正确解构：从 loginRes.data 里取 user 和 token
    const { user, token } = loginRes.data;
    console.log('✅ 拿到 user：', user);
    console.log('✅ 拿到 token：', token);

    if (!token) {
      message.error('未获取到有效 token');
      return;
    }

    localStorage.setItem('hotel_token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
localStorage.setItem('role', user.role);

    message.success('登录成功！');
    console.log('用户角色：', user.role);
    if (user.role === 'admin') {
  navigate('/admin');
} else if (user.role === 'merchant') {
  console.log('匹配到 merch 角色，准备跳转');
  navigate('/merchant/home'); // 你的角色是 merch，应该跳转到这里
  console.log('navigate 已执行');
}

  } catch (error) {
    console.error('❌ 错误详情：', error);
    message.error(`登录出错：${error.message || '未知错误'}`);
  } finally {
    setLoading(false);
  }
};

  // 页面渲染部分保持不变
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