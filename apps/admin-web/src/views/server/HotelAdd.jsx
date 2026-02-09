import React, { useState } from 'react';
import {
  Form, Input, Button, Select, Checkbox, InputNumber,
  Upload, Card, Typography, Space, Divider, message, Modal
} from 'antd';
import { UploadOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './HotelAdd.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 设施选项列表
const facilityOptions = [
  { label: '免费WiFi', value: 'wifi' },
  { label: '免费停车场', value: 'parking' },
  { label: '早餐服务', value: 'breakfast' },
  { label: '电梯', value: 'elevator' },
  { label: '空调', value: 'airCondition' },
  { label: '热水', value: 'hotWater' },
  { label: '洗衣房', value: 'laundry' },
  { label: '健身房', value: 'gym' },
];

// 床型选项
const bedTypeOptions = [
  { label: '单人床', value: 'single' },
  { label: '双人床', value: 'double' },
  { label: '大床房', value: 'king' },
  { label: '榻榻米', value: 'tatami' },
];

const HotelAdd = () => {
  const [form] = Form.useForm();
  const [imageFileList, setImageFileList] = useState([]); // 酒店图片上传列表
  const navigate = useNavigate();

  // 🔥 修复：图片预览功能
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    Modal.info({
      title: '图片预览',
      content: <img src={file.url || file.preview} style={{ width: '100%' }} alt={file.name} />,
      width: 600,
    });
  };

  // 🔥 辅助函数：将文件转为Base64
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // 图片上传前校验
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

    // 🔥 修复：上传时直接生成Base64 URL并更新列表
    getBase64(file).then(base64Url => {
      const newFile = {
        uid: file.uid,
        name: file.name,
        status: 'done',
        url: base64Url,
        originFileObj: file
      };
      setImageFileList(prev => [...prev, newFile]);
    });

    return false; // 阻止自动上传，只用本地预览
  };

  // 处理图片上传变化
  const handleImageChange = ({ fileList }) => {
    // 🔥 修复：正确更新图片列表，保留Base64 URL
    setImageFileList(fileList);
  };

  // 表单提交（核心：确保所有字段都存入localStorage）
  const onFinish = async (values) => {
    try {
      // 🔥 修复：正确提取图片URL（Base64格式）
      const imageUrls = imageFileList
        .filter(file => file.status === 'done' && file.url)
        .map(file => file.url);

      // 验证图片是否上传
      if (imageUrls.length === 0) {
        message.error('请至少上传一张有效图片！');
        return;
      }

      // 获取当前登录的商户信息（兼容本地存储）
      const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
      const merchantName = currentUser.username || currentUser.name || '未知商户';

      // 构造完整的酒店数据（包含所有字段）
      const hotelData = {
        id: Date.now(), // 唯一ID（数字类型）
        hotelName: values.hotelName,
        merchantName: merchantName, // 补充商户名称
        city: values.city,
        address: values.address,
        contactPhone: values.contactPhone,
        description: values.description,
        facilities: values.facilities,
        roomList: values.roomList,
        images: imageUrls, // 保存图片Base64 URL
        status: '待审核', // 兼容旧状态字段
        auditStatus: 'pending', // 审核状态（管理员端使用）
        publishStatus: 'offline', // 发布状态
        createTime: new Date().toLocaleString('zh-CN'), // 录入时间
        rejectReason: '' // 初始化不通过原因
      };

      // 🔥 修复：同步更新两个存储字段，确保管理员端能读取
      const existingMerchantHotels = JSON.parse(localStorage.getItem('merchantHotels')) || [];
      existingMerchantHotels.push(hotelData);
      localStorage.setItem('merchantHotels', JSON.stringify(existingMerchantHotels));

      // 同步更新hotelList，确保管理员审核列表能读取
      const existingHotelList = JSON.parse(localStorage.getItem('hotelList')) || [];
      existingHotelList.push(hotelData);
      localStorage.setItem('hotelList', JSON.stringify(existingHotelList));

      // 触发storage事件，通知其他页面更新
      window.dispatchEvent(new Event('storage'));

      message.success('酒店信息录入成功！图片已同步保存');
      // 跳转路径必须和路由匹配
      navigate('/server/hotel-list');
    } catch (error) {
      message.error('酒店信息录入失败，请稍后重试！');
      console.error('提交失败原因：', error);
    }
  };

  // 测试按钮：快速存入一条完整测试数据（包含图片字段）
  const handleTestSave = () => {
    // 测试用Base64图片（空白图片）
    const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFeAJ5gMm5/gAAAABJRU5ErkJggg==';
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
    const merchantName = currentUser.username || '测试商户';

    const testData = {
      id: Date.now(),
      hotelName: '山药汤汤粉王',
      merchantName: merchantName,
      city: 'guangzhou',
      address: '天河区XX路XX号',
      contactPhone: '13800138000',
      description: '特色酒店，提供免费WiFi和停车场',
      facilities: ['wifi', 'parking'],
      roomList: [{
        roomName: '标准间',
        area: 25.0,
        price: 199.00,
        bedType: 'double'
      }],
      images: [testImageUrl], // 测试图片URL
      status: '待审核',
      auditStatus: 'pending',
      publishStatus: 'offline',
      createTime: new Date().toLocaleString('zh-CN'),
      rejectReason: ''
    };
    
    // 同步更新两个存储字段
    const existingMerchantHotels = JSON.parse(localStorage.getItem('merchantHotels')) || [];
    existingMerchantHotels.push(testData);
    localStorage.setItem('merchantHotels', JSON.stringify(existingMerchantHotels));

    const existingHotelList = JSON.parse(localStorage.getItem('hotelList')) || [];
    existingHotelList.push(testData);
    localStorage.setItem('hotelList', JSON.stringify(existingHotelList));

    message.success('完整测试数据已存入！包含测试图片');
    navigate('/server/hotel-list');
  };

  return (
    <div className="hotel-add-container">
      <Card title={<Title level={3}>酒店信息录入</Title>} bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ facilities: [], roomList: [{ price: 0, area: 0 }] }}
          validateMessages={{
            required: '${label}为必填项！',
            pattern: '${label}格式错误！'
          }}
        >
          {/* 基础信息模块 */}
          <Divider orientation="left">基础信息</Divider>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item
              name="hotelName"
              label="酒店名称"
              rules={[{ required: true }]}
            >
              <Input placeholder="请输入酒店全称" maxLength={100} />
            </Form.Item>

            <Form.Item
              name="city"
              label="所在城市"
              rules={[{ required: true }]}
            >
              <Select placeholder="请选择城市">
                <Option value="beijing">北京</Option>
                <Option value="shanghai">上海</Option>
                <Option value="guangzhou">广州</Option>
                <Option value="shenzhen">深圳</Option>
                {/* 可扩展更多城市 */}
              </Select>
            </Form.Item>

            <Form.Item
              name="address"
              label="详细地址"
              rules={[{ required: true }]}
            >
              <Input placeholder="请输入街道、门牌号等详细地址" maxLength={200} />
            </Form.Item>

            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[
                { required: true },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
              ]}
            >
              <Input placeholder="请输入负责人手机号" maxLength={11} />
            </Form.Item>

            <Form.Item
              name="description"
              label="酒店简介"
              rules={[{ required: true }]}
            >
              <TextArea rows={4} placeholder="请简要介绍酒店特色、服务等" maxLength={500} />
            </Form.Item>
          </Space>

          {/* 设施配置模块 */}
          <Divider orientation="left">设施配置</Divider>
          <Form.Item
            name="facilities"
            label="酒店设施"
            rules={[{ required: true, message: '请至少选择一项设施' }]}
          >
            <Checkbox.Group options={facilityOptions} />
          </Form.Item>

          {/* 房型配置模块（动态增删） */}
          <Divider orientation="left">房型配置</Divider>
          <Form.List name="roomList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: 'flex', marginBottom: 8, alignItems: 'flex-end' }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'roomName']}
                      label={`房型 ${key + 1}`}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="如：标准间、大床房" maxLength={50} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'area']}
                      label="面积(㎡)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} precision={1} placeholder="0.0" style={{ width: 120 }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'price']}
                      label="价格(元/晚)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} precision={2} placeholder="0.00" style={{ width: 120 }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'bedType']}
                      label="床型"
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="请选择床型" style={{ width: 120 }}>
                        {bedTypeOptions.map(item => (
                          <Option key={item.value} value={item.value}>{item.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Button
                      type="text"
                      danger
                      icon={<MinusOutlined />}
                      onClick={() => remove(name)}
                    >
                      删除
                    </Button>
                  </Space>
                ))}

                <Form.Item>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
                  >
                    添加房型
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* 图片上传模块 */}
          <Divider orientation="left">酒店图片</Divider>
          <Form.Item
            label="上传酒店图片"
            rules={[{ required: true, message: '请至少上传一张酒店图片' }]}
          >
            <Upload
              name="file"
              listType="picture-card"
              fileList={imageFileList}
              beforeUpload={beforeUpload}
              onChange={handleImageChange}
              onPreview={handlePreview} // 🔥 新增：图片预览
              multiple
              // 🔥 修复：移除action，避免自动上传
              action={() => {}}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>点击上传</div>
              </div>
            </Upload>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              支持上传多张图片，单张图片不超过2MB，格式为JPG/PNG/JPEG
            </Text>
          </Form.Item>

          {/* 提交按钮区 */}
          <Form.Item style={{ textAlign: 'center', marginTop: 20 }}>
            <Space size="middle">
              <Button type="primary" htmlType="submit" size="large">
                提交保存
              </Button>
              <Button 
                type="dashed" 
                onClick={handleTestSave}
                size="large"
              >
                测试存入完整数据
              </Button>
              <Button size="large" onClick={() => form.resetFields()}>
                重置表单
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default HotelAdd;