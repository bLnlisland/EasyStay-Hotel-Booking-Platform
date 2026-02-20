import React, { useState, useRef } from 'react';
import { Form, Input, Button, Upload, message, Card, Typography, Radio } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
  const [fileList, setFileList] = useState([]);
  const [licenseImageUrl, setLicenseImageUrl] = useState(''); // 上传成功后后端返回的图片地址
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [role, setRole] = useState('merchant');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      // 1. 商户专属校验
      if (role === 'merchant') {
        if (!licenseImageUrl) {
          message.error('请上传营业执照照片！');
          setLoading(false);
          return;
        }
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
          license_image: licenseImageUrl,
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
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB！');
      return Upload.LIST_IGNORE;
    }
    return true; // 通过校验，由 customRequest 实际上传
  };

  const customRequest = ({ file, onSuccess, onError }) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('license', file);
    // 不设置 Content-Type，让浏览器自动带 multipart boundary
    request.post('/auth/upload/license', formData, { headers: { 'Content-Type': undefined } })
      .then((res) => {
        if (res.data && res.data.success && res.data.url) {
          setLicenseImageUrl(res.data.url);
          setFileList([{
            uid: file.uid,
            name: file.name,
            status: 'done',
            url: res.data.url.startsWith('http') ? res.data.url : (window.location.origin + res.data.url),
          }]);
          onSuccess(res.data);
          message.success('上传成功');
        } else {
          onError(new Error(res.data?.message || '上传失败'));
        }
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.message || '上传失败';
        message.error(msg);
        onError(err);
      })
      .finally(() => setUploading(false));
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    if (newFileList.length === 0) setLicenseImageUrl('');
  };

  return (
    <div className="merchant-register-container">
      <Card className="register-card" hoverable bordered={false} style={{ maxWidth: '500px', margin: '80px auto', padding: '30px' }}>
        <Title level={2} className="register-title" style={{ textAlign: 'center', marginBottom: '30px', color: '#1677ff' }}>
          注册
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
              <Radio.Group value={role} onChange={(e) => {
              setRole(e.target.value);
              setFileList([]);
              setLicenseImageUrl('');
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

              <Form.Item
                label="营业执照照片"
                required
                validateStatus={role === 'merchant' && !licenseImageUrl ? 'error' : ''}
                help={role === 'merchant' && !licenseImageUrl ? '请上传营业执照照片（JPG/PNG，不超过 2MB）' : undefined}
              >
                <Upload
                  fileList={fileList}
                  beforeUpload={beforeUpload}
                  customRequest={customRequest}
                  onChange={handleUploadChange}
                  maxCount={1}
                  accept=".jpg,.jpeg,.png"
                  listType="picture-card"
                >
                  {fileList.length >= 1 ? null : (
                    <div>
                      <UploadOutlined style={{ fontSize: 24 }} />
                      <div style={{ marginTop: 8 }}>点击上传</div>
                    </div>
                  )}
                </Upload>
                <div className="upload-tip" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  JPG/PNG/JPEG，单张不超过 2MB
                </div>
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
              style={{ width: '100%', backgroundColor: '#1677ff' }}
              loading={loading}
            >
              提交注册
            </Button>
          </Form.Item>

          {/* 返回登录 */}
          <Form.Item style={{ textAlign: 'center', marginBottom: 0 }}>
            <Link to="/login" style={{ color: '#1677ff', fontSize: '14px' }}>
              已有账号？返回登录
            </Link>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MerchantRegister;