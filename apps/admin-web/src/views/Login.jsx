// 公共登录页（后续你在这里开发登录功能）
import React from 'react';
import { Button, Form, Input } from 'antd'; // 引入AntD组件，测试是否可用

const Login = () => {
  return (
    <div style={{ width: 400, margin: '100px auto', textAlign: 'center' }}>
      <h1>酒店系统登录页</h1>
      {/* 测试AntD组件，能显示说明配置成功 */}
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 16 }}>
        <Form.Item label="账号" name="username">
          <Input placeholder="请输入账号" />
        </Form.Item>
        <Form.Item label="密码" name="password">
          <Input.Password placeholder="请输入密码" />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
          <Button type="primary" htmlType="submit">登录</Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default Login;