import React, { useState } from 'react';
import {
  Form, Input, Button, Select, Checkbox, InputNumber,
  Upload, Card, Typography, Space, Divider, message, Modal
} from 'antd';
import { UploadOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
// 修正导入路径：从merchant目录往上两级到src，再进utils
import { hotelApi } from '../../utils/request'; 
import './HotelAdd.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// 设施选项列表（与API字段名保持一致）
const facilityOptions = [
  { label: '免费WiFi', value: 'wifi' },
  { label: '停车场', value: 'parking' },
  { label: '游泳池', value: 'swimming_pool' },
  { label: '健身房', value: 'gym' },
  { label: '餐厅', value: 'restaurant' },
  { label: '会议室', value: 'meeting_room' },
  { label: '商务中心', value: 'business_center' },
  { label: '机场接送', value: 'airport_shuttle' },
  { label: '洗衣服务', value: 'laundry' },
  { label: '叫车服务', value: 'car_hailing' },
  { label: '无障碍设施', value: 'accessible' },
  { label: '24小时前台', value: '24h_frontdesk' },
  { label: '行李寄存', value: 'luggage_storage' },
  { label: '外币兑换', value: 'currency_exchange' },
  { label: '旅游票务', value: 'travel_tickets' },
];

const HotelAdd = () => {
  const [form] = Form.useForm();
  const [imageFileList, setImageFileList] = useState([]); // 保留图片列表state
  const navigate = useNavigate();

  // 保留图片预览方法（但禁用实际预览）
  const handlePreview = async (file) => {
    message.info('图片上传功能暂未启用，调试期间无需上传');
    return false;
  };

  // 保留方法但禁用文件转换
  const getBase64 = (file) => {
    return new Promise((resolve) => resolve(''));
  };

  // 🔥 禁用文件上传：直接提示并返回false
  const beforeUpload = (file) => {
    message.info('图片上传功能暂未启用，调试期间无需上传');
    return false;
  };

  // 保留图片列表变化方法
  const handleImageChange = ({ fileList }) => {
    setImageFileList(fileList);
  };

  // 核心：创建酒店逻辑（移除图片相关验证和提交）
  const onFinish = async (values) => {
    try {
      // 🔥 移除图片验证逻辑（不再校验是否上传图片）
      // if (imageFileList.length === 0) {
      //   message.error('请至少上传一张有效图片！');
      //   return;
      // }

      // 构造请求体（移除images字段，不提交图片数据）
      const requestBody = {
        name_zh: values.hotelName,          
        city: values.city,                 
        address: values.address,           
        star_rating: values.star_rating,   
        facilities: values.facilities,    
        room_types: values.room_types.map(room => ({ 
          name: room.name,
          base_price: room.base_price,
          discount_rate: room.discount_rate || 0 
        }))
        // 🔥 注释掉图片字段，不提交到接口
        // images: imageFileList.map(file => file.url)
      };

      // 调用创建酒店接口
      const response = await hotelApi.createHotel(requestBody);

      if (response.success) {
        message.success('酒店创建成功！');
        navigate('/merchant/hotel-list');
      }
    } catch (error) {
      console.error('提交失败：', error);
    }
  };

  return (
    <div className="hotel-add-container">
      <Card title={<Title level={3}>创建酒店（商户）</Title>} bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            facilities: [],
            star_rating: 3, 
            room_types: [{ name: '', base_price: 0, discount_rate: 0 }]
          }}
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
              label="酒店名称（中文）"
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
              name="star_rating"
              label="酒店星级"
              rules={[{ required: true }]}
            >
              <Select placeholder="请选择星级">
                <Option value={1}>一星级</Option>
                <Option value={2}>二星级</Option>
                <Option value={3}>三星级</Option>
                <Option value={4}>四星级</Option>
                <Option value={5}>五星级</Option>
              </Select>
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
          <Form.List name="room_types">
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
                      name={[name, 'name']}
                      label={`房型 ${key + 1}`}
                      rules={[{ required: true }]}
                    >
                      <Input placeholder="如：标准间、大床房" maxLength={50} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'base_price']}
                      label="基础价格(元/晚)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} precision={2} placeholder="0.00" style={{ width: 140 }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'discount_rate']}
                      label="折扣率"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} max={1} step={0.01} precision={2} placeholder="0.00" style={{ width: 120 }} />
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

          {/* 🔥 保留图片上传UI，但禁用必填校验和实际上传功能 */}
          <Divider orientation="left">酒店图片（调试期间无需上传）</Divider>
          <Form.Item
            label="上传酒店图片"
            rules={[]} // 🔥 清空必填校验规则
          >
            <Upload
              name="file"
              listType="picture-card"
              fileList={imageFileList}
              beforeUpload={beforeUpload} // 禁用上传
              onChange={handleImageChange}
              onPreview={handlePreview} // 禁用预览
              multiple
              action={() => {}} // 空action，防止自动上传
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>调试期间无需上传</div>
              </div>
            </Upload>
            <Text type="secondary" style={{ marginTop: 8, display: 'block', color: '#999' }}>
              调试期间暂不启用图片上传功能，正式环境将支持JPG/PNG/JPEG格式（单张≤2MB）
            </Text>
          </Form.Item>

          {/* 提交按钮区 */}
          <Form.Item style={{ textAlign: 'center', marginTop: 20 }}>
            <Space size="middle">
              <Button type="primary" htmlType="submit" size="large">
                创建酒店
              </Button>
              <Button size="large" onClick={() => form.resetFields()}>
                重置表单
              </Button>
              <Button size="large" onClick={() => navigate('/merchant/home')}>
                返回首页
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default HotelAdd;