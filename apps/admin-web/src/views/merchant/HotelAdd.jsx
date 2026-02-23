import React, { useState } from 'react';
import {
  Form, Input, Button, Select, Checkbox, InputNumber,
  Upload, Card, Typography, Space, Divider, message
} from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
// 修正导入路径：从merchant目录往上两级到src，再进utils
import { hotelApi } from '../../utils/request'; 
import './HotelAdd.css';

const { Title, Text } = Typography;
const { Option } = Select;

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

  // 图片选择后不自动上传，仅收集到列表，提交时再上传
  const beforeUpload = () => false;

  const handleImageChange = ({ fileList }) => {
    setImageFileList(fileList);
  };

  const onFinish = async (values) => {
    try {
      const requestBody = {
        name_zh: values.hotelName,
        city: values.city,
        address: values.address,
        star_rating: values.star_rating,
        facilities: values.facilities,
        room_types: values.room_types.map(room => ({
          name: room.name,
          base_price: room.base_price,
          area: room.area != null && room.area !== '' ? room.area : null
        }))
      };

      const response = await hotelApi.createHotel(requestBody);
      if (!response.success || !response.data?.id) {
        message.error(response.message || '创建失败');
        return;
      }

      const hotelId = response.data.id;
      const filesToUpload = imageFileList
        .filter(f => f.originFileObj)
        .map(f => f.originFileObj);

      if (filesToUpload.length > 0) {
        const formData = new FormData();
        filesToUpload.forEach((file, idx) => formData.append('images', file));
        formData.append('mainIndex', '0');
        try {
          await hotelApi.uploadHotelImages(hotelId, formData);
        } catch (uploadErr) {
          message.warning('酒店已创建，但图片上传失败，可在编辑页重新上传');
        }
      }

      message.success('酒店创建成功！');
      navigate('/merchant/hotel-list');
    } catch (error) {
      console.error('提交失败：', error);
      message.error(error?.message || '创建失败，请重试');
    }
  };

  return (
    <div className="app-page hotel-add-container">
      <Card className="app-card" title={<Title level={4} style={{ margin: 0 }}>创建酒店</Title>} bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            facilities: [],
            star_rating: 3, 
            room_types: [{ name: '', base_price: 0, area: null }]
          }}
          validateMessages={{
            /* eslint-disable no-template-curly-in-string */
            required: '${label}为必填项！',
            pattern: '${label}格式错误！'
            /* eslint-enable no-template-curly-in-string */
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
                      label="价格(元/晚)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} precision={2} placeholder="0.00" style={{ width: 140 }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'area']}
                      label="面积(㎡)"
                    >
                      <InputNumber min={0} precision={0} placeholder="选填" style={{ width: 100 }} />
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

          <Divider orientation="left">酒店图片</Divider>
          <Form.Item label="上传酒店图片" rules={[]}>
            <Upload
              name="file"
              listType="picture-card"
              fileList={imageFileList}
              beforeUpload={beforeUpload}
              onChange={handleImageChange}
              multiple
              accept="image/jpeg,image/jpg,image/png"
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传图片</div>
              </div>
            </Upload>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              支持 JPG/PNG，创建酒店后可在此选择多张图片，提交时一并上传（选填）
            </Text>
          </Form.Item>

          {/* 提交按钮区 */}
          <Form.Item style={{ textAlign: 'center', marginTop: 24 }}>
            <Space size="middle">
              <Button type="primary" htmlType="submit" size="large" className="app-btn-primary">
                创建酒店
              </Button>
              <Button size="large" className="app-btn-default" onClick={() => form.resetFields()}>
                重置表单
              </Button>
              <Button size="large" className="app-btn-default" onClick={() => navigate('/merchant/home')}>
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