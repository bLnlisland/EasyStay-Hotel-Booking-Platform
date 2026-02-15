import React, { useState, useRef } from 'react';
import { Form, Input, Button, Upload, message, Card, Typography, Radio } from 'antd';
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './Register.css';

const { Title } = Typography;

const MerchantRegister = () => {
  const formRef = useRef(null);
  const [fileList, setFileList] = useState([]);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [role, setRole] = useState('merchant'); // 默认选中商户
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      // 1. 商户专属校验（仅商户需要）
      if (role === 'merchant') {
        // 校验营业执照照片
        if (fileList.length === 0) {
          message.error('请上传营业执照照片！');
          return;
        }
        // 校验统一社会信用代码
        const creditCodeReg = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/;
        if (!creditCodeReg.test(values.businessLicense)) {
          message.error('统一社会信用代码格式不正确！');
          return;
        }
      }

      // 2. 通用校验：两次密码一致
      if (values.password !== values.confirmPassword) {
        message.error('两次输入的密码不一致！');
        return;
      }

      // 3. 检查账号是否已注册
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || [];
      const isExist = registeredUsers.some(item => item.username === values.username);
      if (isExist) {
        message.error('此账号已注册，请直接登录！');
        return;
      }

      // 4. 构造用户数据（根据角色区分字段）
      const newUser = {
        username: values.username,
        password: values.password,
        role: role,
        // 仅商户保留额外信息
        ...(role === 'merchant' && {
          merchantName: values.merchantName,
          contactName: values.contactName,
          phone: values.phone,
          businessLicense: values.businessLicense,
          licenseImage: fileList[0]?.response?.data?.url || 'mock_image_url' // 模拟图片地址
        })
      };

      // 5. 保存到本地存储
      registeredUsers.push(newUser);
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

      // 6. 注册成功提示+跳转
      message.success(`${role === 'admin' ? '管理员' : '商户'}注册成功！即将跳转到登录页`);
      setRegisterSuccess(true);
      
      setTimeout(() => {
        navigate('/'); // 跳转到登录页
      }, 2000);
    } catch (error) {
      message.error('注册失败，请稍后重试！');
      console.error('注册错误：', error);
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
    return true;
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
          {/* 1. 角色选择（核心：决定显示哪些字段） */}
          <Form.Item
            label="注册角色"
            name="role"
            rules={[{ required: true, message: '请选择注册角色' }]}
          >
            <Radio.Group value={role} onChange={(e) => {
              setRole(e.target.value);
              setFileList([]); // 切换角色清空上传文件
            }}>
              <Radio value="merchant">商户</Radio>
              <Radio value="admin">管理员</Radio>
            </Radio.Group>
          </Form.Item>

          {/* 2. 通用字段：账号（所有角色都需要） */}
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

          {/* 3. 通用字段：密码（所有角色都需要） */}
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

          {/* 4. 通用字段：确认密码（所有角色都需要） */}
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

          {/* ========== 商户专属字段（仅商户显示） ========== */}
          {role === 'merchant' && (
            <>
              {/* 商户名称 */}
              <Form.Item
                label="商户名称"
                name="merchantName"
                rules={[{ required: true }, { max: 50 }]}
              >
                <Input placeholder="请输入商户全称" maxLength={50} showCount />
              </Form.Item>

              {/* 联系人 */}
              <Form.Item
                label="联系人"
                name="contactName"
                rules={[{ required: true }, { max: 20 }]}
              >
                <Input placeholder="请输入联系人姓名" maxLength={20} showCount />
              </Form.Item>

              {/* 手机号 */}
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

              {/* 营业执照 */}
              <Form.Item
                label="营业执照"
                name="businessLicense"
                rules={[
                  { required: true },
                  { pattern: /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/, message: '统一社会信用代码格式不正确！' },
                ]}
              >
                <Input placeholder="请输入统一社会信用代码" maxLength={18} showCount />
              </Form.Item>

              {/* 执照照片 */}
              <Form.Item label="执照照片">
                <Upload
                  fileList={fileList}
                  beforeUpload={beforeUpload}
                  onChange={handleUploadChange}
                  action="/api/upload/image" // 模拟上传接口
                  maxCount={1}
                  accept=".jpg,.jpeg,.png"
                >
                  <Button icon={<UploadOutlined />} type="primary">点击上传</Button>
                </Upload>
                <div className="upload-tip" style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  仅支持JPG/PNG/JPEG格式，大小不超过2MB
                </div>
              </Form.Item>
            </>
          )}

          {/* 提交按钮 */}
          <Form.Item style={{ marginTop: '20px' }}>
            <Button type="primary" htmlType="submit" size="large" style={{ width: '100%', backgroundColor: '#1677ff' }}>
              提交注册
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default MerchantRegister;