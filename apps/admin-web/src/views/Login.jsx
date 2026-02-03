import React, { useState } from 'react';
import { Form, Input, Button, Radio, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

const Login = () => {
  // 用于切换角色（商户/管理员）
  const [role, setRole] = useState('merchant');

  // 表单提交处理
  const onFinish = (values) => {
    console.log('登录表单提交:', values);
    // 这里可以添加登录接口调用逻辑
    message.success(`${role === 'merchant' ? '商户' : '管理员'}登录成功`);
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: '20px', border: '1px solid #e8e8e8', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 32 }}>统一登录</h2>
      
      {/* 角色选择 */}
      <Radio.Group
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ width: '100%', marginBottom: 24, textAlign: 'center' }}
      >
        <Radio.Button value="merchant">商户</Radio.Button>
        <Radio.Button value="manager">管理员</Radio.Button>
      </Radio.Group>

      {/* 登录表单 */}
      <Form
        name="login"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="account"
          label="账号"
          rules={[
            { required: true, message: '请输入账号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' }
          ]}
        >
          <Input prefix={<UserOutlined />} placeholder="请输入手机号" />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码长度不能少于6位' }
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
        </Form.Item>

        <Form.Item
          name="captcha"
          label="验证码"
          rules={[
            { required: true, message: '请输入验证码' },
            { len: 6, message: '验证码长度为6位' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="请输入验证码" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            登录
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;