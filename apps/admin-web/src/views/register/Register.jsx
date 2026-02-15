import React, { useState, useRef } from 'react';
import { Form, Input, Button, Upload, message, Card, Typography, Radio } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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
  const [fileList, setFileList] = useState([]);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [role, setRole] = useState('merchant');
  const [loading, setLoading] = useState(false); // 新增加载状态
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // 1. 商户专属校验
      if (role === 'merchant') {
        // 临时注释图片校验（后端无上传接口），先跑通注册流程
        // if (fileList.length === 0) {
        //   message.error('请上传营业执照照片！');
        //   return;
        // }
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
          email: values.email, // 新增：后端必填
          password: values.password,
          business_name: values.merchantName,
          business_license: values.businessLicense,
          license_image: 'https://via.placeholder.com/300', // 临时兜底，后端无上传接口
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
        message.error(response.data.message || '注册失败！');
      }
    } catch (error) {
      console.error('注册错误：', error);
      // 解析后端详细错误
      const errMsg = error.response?.data?.message || 
                     error.response?.data?.error || 
                     '注册失败，请检查参数格式！';
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg';
    if (!isImage) {
      message.error('只能上传 JPG/PNG/JPEG 格式的图片！');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
      return false;
    }
    // 临时阻止上传（后端无接口）
    message.warning('图片上传接口暂未实现，已跳过上传！');
    return false;
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  return (
    <div className="merchant-register-container">
      <Card className="register-card" hoverable bordered={false} style={{ maxWidth: '500px', margin: '80px auto', padding: '30px' }}>
        <Title level={2} className="register-title" style={{ textAlign: 'center', marginBottom: '30px', color: '#1677ff' }}>
          用户注册
        </Title>
        
        {registerSuccess && (
          <div className="success-tip" style={{ textAlign: 'center', marginBottom: '20px', color: '#52c41a' }}>
            <CheckCircleOutlined className="success-icon" style={{ fontSize: '24px', marginRight: '8px' }} />
            <span>注册成功，即将跳转到登录页...</span>
          </div>
        )}

        <Form
          ref={formRef}
          layout="vertical"
          onFinish={handleSubmit}
          validateMessages={{
            required: '${label}为必填项！',
            pattern: '${label}格式不正确！',
            max: '${label}长度不能超过${max}个字符！',
            min: '${label}长度不能少于${min}个字符！',
          }}
        >
          {/* 1. 角色选择 */}
          <Form.Item
            label="注册角色"
            name="role"
            rules={[{ required: true, message: '请选择注册角色' }]}
          >
            <Radio.Group value={role} onChange={(e) => {
              setRole(e.target.value);
              setFileList([]);
            }}>
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

              {/* 临时注释图片上传的必填校验，保留组件但阻止上传 */}
              <Form.Item label="执照照片（暂无需上传）">
                <Upload
                  fileList={fileList}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  action="#" // 空地址，阻止上传
                  maxCount={1}
                  accept=".jpg,.jpeg,.png"
                >
                  <Button icon={<UploadOutlined />} type="primary" disabled>点击上传（暂未开放）</Button>
                </Upload>
                <div className="upload-tip" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  图片上传功能暂未实现，注册无需上传
                </div>
              </Form.Item>

              <Form.Item
                label="经营地址（可选）"
                name="address"
                rules={[{ max: 100 }]}
              >
                <Input placeholder="请输入经营地址" maxLength={100} />
              </Form.Item>

              <Form.Item
                label="负责人姓名（可选）"
                name="fullName"
                rules={[{ max: 20 }]}
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
              style={{ width: '100%', backgroundColor: '#1677ff' }}
              loading={loading}
            >
              提交注册
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MerchantRegister;