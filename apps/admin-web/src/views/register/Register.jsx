import React, { useState, useRef } from 'react';
import { Form, Input, Button, message, Card, Typography, Radio, Alert } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const { Title } = Typography;

// 1. 创建axios实例，指向后端（前端改端口后用代理，这里写相对路径）
const request = axios.create({
  baseURL: '/api', // 配合前端代理，自动转发到http://localhost:3000/api
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const MerchantRegister = () => {
  const formRef = useRef(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [role, setRole] = useState('merchant');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setSubmitError('');
    try {
      setLoading(true);
      // 1. 商户专属校验
      if (role === 'merchant') {
        const creditCodeReg = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
        if (!creditCodeReg.test(values.businessLicense)) {
          message.error('统一社会信用代码格式不正确！');
          return;
        }
      }

      // 2. 通用校验
      if (values.password !== values.confirmPassword) {
        message.error('两次输入的密码不一致！');
        return;
      }

      // 3. 构造请求参数（严格对齐后端API）
      let requestData, apiUrl;
      if (role === 'merchant') {
        requestData = {
          username: values.username,
          email: values.email,
          password: values.password,
          business_name: values.merchantName,
          business_license: values.businessLicense,
          contact_name: values.contactName,
          phone: values.phone,
          address: values.address || '',
          full_name: values.fullName || '',
        };
        apiUrl = '/auth/register/merchant';
      } else {
        requestData = {
          username: values.username,
          email: values.email, // 新增：后端必填
          password: values.password,
          full_name: values.fullName || '',
          phone: values.phone || '',
        };
        apiUrl = '/auth/register/admin';
      }

      // 4. 发送POST请求（核心：用axios.post，不是浏览器GET）
      const response = await request.post(apiUrl, requestData);
      
      if (response.data.success) {
        message.success(`${role === 'admin' ? '管理员' : '商户'}注册成功！即将跳转到登录页`);
        setRegisterSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        const msg = response.data.message || '注册失败！';
        const details = response.data.errors;
        const errMsg = details && details.length ? `${msg}（${details.join('；')}）` : msg;
        setSubmitError(errMsg);
        message.error(errMsg);
      }
    } catch (error) {
      console.error('注册错误：', error);
      const data = error.response?.data;
      const msg = data?.message || data?.error || '注册失败，请检查参数格式！';
      const details = data?.errors;
      const errMsg = details && details.length ? `${msg}（${details.join('；')}）` : msg;
      setSubmitError(errMsg);
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="auth-card" hoverable bordered={false} style={{ maxWidth: '500px' }}>
        <Title level={2} className="auth-title">注册</Title>
        
        {registerSuccess && (
          <div className="success-tip" style={{ textAlign: 'center', marginBottom: '20px', color: '#52c41a' }}>
            <CheckCircleOutlined className="success-icon" style={{ fontSize: '24px', marginRight: '8px' }} />
            <span>注册成功，即将跳转到登录页...</span>
          </div>
        )}

        {submitError && (
          <Alert
            type="error"
            message={submitError}
            showIcon
            closable
            onClose={() => setSubmitError('')}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          ref={formRef}
          layout="vertical"
          initialValues={{ role: 'merchant' }}
          onFinish={handleSubmit}
          validateMessages={{
            /* eslint-disable no-template-curly-in-string */
            required: '${label}为必填项！',
            pattern: '${label}格式不正确！',
            max: '${label}长度不能超过${max}个字符！',
            min: '${label}长度不能少于${min}个字符！',
            /* eslint-enable no-template-curly-in-string */
          }}
        >
          {/* 1. 角色选择 */}
          <Form.Item
            label="注册角色"
            name="role"
            rules={[{ required: true, message: '请选择注册角色' }]}
          >
              <Radio.Group value={role} onChange={(e) => setRole(e.target.value)}>
              <Radio value="merchant">商户</Radio>
              <Radio value="admin">管理员</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 新增：邮箱（后端必填） */}
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱！' },
              { type: 'email', message: '邮箱格式不正确！' },
            ]}
          >
            <Input placeholder="请输入邮箱（如：test@test.com）" />
          </Form.Item>

          {/* 2. 登录账号 */}
          <Form.Item
            label="登录账号"
            name="username"
            rules={[
              { required: true },
              { min: 3, message: '账号长度不能少于3位！' },
              { max: 20, message: '账号长度不能超过20位！' },
            ]}
          >
            <Input placeholder="请设置登录账号" maxLength={20} showCount />
          </Form.Item>

          {/* 3. 密码 */}
          <Form.Item
            label="设置密码"
            name="password"
            rules={[
              { required: true },
              { min: 6, message: '密码长度不能少于6位！' },
              { max: 20, message: '密码长度不能超过20位！' },
            ]}
          >
            <Input.Password placeholder="请设置登录密码" maxLength={20} />
          </Form.Item>

          {/* 4. 确认密码 */}
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            rules={[
              { required: true },
              { min: 6, message: '密码长度不能少于6位！' },
            ]}
          >
            <Input.Password placeholder="请再次输入密码" maxLength={20} />
          </Form.Item>

          {/* 商户专属字段 */}
          {role === 'merchant' && (
            <>
              <Form.Item
                label="商户名称"
                name="merchantName"
                rules={[{ required: true }, { max: 50 }]}
              >
                <Input placeholder="请输入商户全称" maxLength={50} showCount />
              </Form.Item>

              <Form.Item
                label="联系人"
                name="contactName"
                rules={[{ required: true }, { max: 20 }]}
              >
                <Input placeholder="请输入联系人姓名" maxLength={20} showCount />
              </Form.Item>

              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  { required: true },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确！' },
                ]}
              >
                <Input placeholder="请输入11位手机号" maxLength={11} />
              </Form.Item>

              <Form.Item
                label="统一社会信用代码"
                name="businessLicense"
                rules={[
                  { required: true },
                  { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '统一社会信用代码格式不正确！' },
                ]}
              >
                <Input placeholder="请输入18位统一社会信用代码" maxLength={18} showCount />
              </Form.Item>

              <Form.Item
                label="经营地址"
                name="address"
                rules={[{ max: 100 },
                  {required:true}
                ]}
              >
                <Input placeholder="请输入经营地址" maxLength={100} />
              </Form.Item>

              <Form.Item
                label="负责人姓名"
                name="fullName"
                rules={[{ max: 20 },
                  {required:true}
                ]}
              >
                <Input placeholder="请输入负责人姓名" maxLength={20} />
              </Form.Item>
            </>
          )}

          {/* 管理员专属字段 */}
          {role === 'admin' && (
            <>
              <Form.Item
                label="姓名（可选）"
                name="fullName"
                rules={[{ max: 20 }]}
              >
                <Input placeholder="请输入姓名" maxLength={20} />
              </Form.Item>

              <Form.Item
                label="手机号（可选）"
                name="phone"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确！' },
                ]}
              >
                <Input placeholder="请输入11位手机号" maxLength={11} />
              </Form.Item>
            </>
          )}

          {/* 提交按钮（添加加载状态） */}
          <Form.Item style={{ marginTop: '20px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block
              className="app-btn-primary"
              style={{ height: 44 }}
              loading={loading}
            >
              提交注册
            </Button>
          </Form.Item>

          {/* 返回登录 */}
          <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
            <Link to="/login" style={{ color: 'var(--primary)', fontSize: 14 }}>
              已有账号？返回登录
            </Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MerchantRegister;