import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Select, Checkbox, InputNumber,
  Upload, Card, Typography, Space, Divider, Modal, message
} from 'antd';
import { PlusOutlined, MinusOutlined, SyncOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
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

const HotelEdit = () => {
  const [form] = Form.useForm();
  const [imageFileList, setImageFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams(); // URL中的ID（字符串类型）

  // 加载酒店数据（简化版，确保能稳定读取）
  const loadHotelData = () => {
    try {
      setLoading(true);
      // 1. 强制读取最新数据
      const merchantHotelsStr = localStorage.getItem('merchantHotels');
      const existingHotels = merchantHotelsStr ? JSON.parse(merchantHotelsStr) : [];
      
      // 2. 兼容所有ID类型（数字/字符串）
      const targetHotel = existingHotels.find(hotel => {
        return hotel.id.toString() === id.toString();
      });
      
      if (!targetHotel) {
        message.error('未找到该酒店信息！');
        navigate('/server/hotel-list');
        setLoading(false);
        return;
      }

      // 3. 初始化表单（确保所有字段都有默认值）
      form.setFieldsValue({
        hotelName: targetHotel.hotelName || '',
        city: targetHotel.city || '',
        address: targetHotel.address || '',
        contactPhone: targetHotel.contactPhone || '',
        description: targetHotel.description || '',
        facilities: targetHotel.facilities || [],
        roomList: targetHotel.roomList || [{ roomName: '', area: 0, price: 0, bedType: '' }]
      });

      // 4. 初始化图片（兼容空数组）
      const initImageList = [];
      if (targetHotel.images && Array.isArray(targetHotel.images) && targetHotel.images.length > 0) {
        targetHotel.images.forEach((url, index) => {
          initImageList.push({
            uid: `img-${index}-${Date.now()}`,
            name: `酒店图片${index + 1}`,
            status: 'done',
            url: url
          });
        });
      }
      setImageFileList(initImageList);
      setLoading(false);
    } catch (error) {
      console.error('加载酒店数据失败：', error);
      message.error('加载失败，请刷新页面重试！');
      setLoading(false);
      navigate('/server/hotel-list');
    }
  };

  // 初始化 + 监听刷新
  useEffect(() => {
    loadHotelData();
    // 监听本地存储变化
    const handleStorage = () => loadHotelData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [id]);

  // 图片转Base64
  const getBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
    });
  };

  // 图片上传处理
  const beforeUpload = async (file) => {
    const isImage = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
    const isLt2M = file.size / 1024 / 1024 < 2;
    
    if (!isImage) { message.error('只能上传JPG/PNG格式图片！'); return false; }
    if (!isLt2M) { message.error('图片大小不能超过2MB！'); return false; }

    // 生成Base64并添加到列表
    const base64Url = await getBase64(file);
    setImageFileList(prev => [
      ...prev,
      { uid: file.uid, name: file.name, status: 'done', url: base64Url }
    ]);
    return false;
  };

  // 图片删除确认
  const handleRemove = (file) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      onOk: () => {
        setImageFileList(prev => prev.filter(item => item.uid !== file.uid));
        message.success('图片已删除');
      }
    });
    return false;
  };

  // 核心保存逻辑（极简稳定版）
  const onFinish = async (values) => {
    try {
      // 1. 基础验证
      const validImages = imageFileList.filter(f => f.status === 'done' && f.url);
      if (validImages.length === 0) {
        message.error('请至少保留一张酒店图片！');
        return;
      }

      // 2. 读取所有数据
      const merchantHotels = JSON.parse(localStorage.getItem('merchantHotels')) || [];
      const hotelList = JSON.parse(localStorage.getItem('hotelList')) || [];

      // 3. 找到要修改的酒店（终极兼容）
      const mIndex = merchantHotels.findIndex(h => h.id.toString() === id.toString());
      const hIndex = hotelList.findIndex(h => h.id.toString() === id.toString());

      if (mIndex === -1 || hIndex === -1) {
        message.error('酒店数据不存在，无法修改！');
        return;
      }

      // 4. 构造新数据（保留所有原有字段）
      const newHotelData = {
        ...merchantHotels[mIndex], // 保留所有旧数据
        ...values,                 // 覆盖修改的字段
        images: validImages.map(f => f.url), // 新图片列表
        updateTime: new Date().toLocaleString()
      };

      // 5. 强制更新
      merchantHotels[mIndex] = newHotelData;
      hotelList[hIndex] = newHotelData;

      // 6. 写入本地存储（关键：确保写入成功）
      localStorage.setItem('merchantHotels', JSON.stringify(merchantHotels));
      localStorage.setItem('hotelList', JSON.stringify(hotelList));

      // 7. 触发刷新 + 跳转
      window.dispatchEvent(new Event('storage'));
      message.success('所有信息修改成功！');
      setTimeout(() => navigate('/server/hotel-list'), 600);

    } catch (error) {
      console.error('保存失败详情：', error);
      message.error('修改失败！错误原因：' + error.message);
    }
  };

  return (
    <div className="hotel-add-container">
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>编辑酒店信息</Title>
            <Button 
              type="text" 
              icon={<SyncOutlined />} 
              onClick={loadHotelData}
              loading={loading}
            >
              刷新数据
            </Button>
          </div>
        } 
        style={{ border: 'none', boxShadow: 'none' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loading}
          validateMessages={{
            required: '此项为必填项！',
            pattern: '格式错误！'
          }}
        >
          {/* 基础信息 */}
          <Divider orientation="left">基础信息</Divider>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Form.Item name="hotelName" label="酒店名称" rules={[{ required: true }]}>
              <Input placeholder="请输入酒店全称" maxLength={100} />
            </Form.Item>

            <Form.Item name="city" label="所在城市" rules={[{ required: true }]}>
              <Select placeholder="请选择城市">
                <Option value="beijing">北京</Option>
                <Option value="shanghai">上海</Option>
                <Option value="guangzhou">广州</Option>
                <Option value="shenzhen">深圳</Option>
              </Select>
            </Form.Item>

            <Form.Item name="address" label="详细地址" rules={[{ required: true }]}>
              <Input placeholder="请输入详细地址" maxLength={200} />
            </Form.Item>

            <Form.Item 
              name="contactPhone" 
              label="联系电话" 
              rules={[{ required: true }, { pattern: /^1[3-9]\d{9}$/, message: '手机号格式错误' }]}
            >
              <Input placeholder="请输入手机号" maxLength={11} />
            </Form.Item>

            <Form.Item name="description" label="酒店简介" rules={[{ required: true }]}>
              <TextArea rows={4} placeholder="请输入酒店简介" maxLength={500} />
            </Form.Item>
          </Space>

          {/* 设施配置 */}
          <Divider orientation="left">设施配置</Divider>
          <Form.Item 
            name="facilities" 
            label="酒店设施" 
            rules={[{ required: true, message: '请至少选择一项设施' }]}
          >
            <Checkbox.Group options={facilityOptions} />
          </Form.Item>

          {/* 房型配置 */}
          <Divider orientation="left">房型配置</Divider>
          <Form.List name="roomList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'roomName']} label={`房型 ${key + 1}`} rules={[{ required: true }]}>
                      <Input placeholder="标准间/大床房等" maxLength={50} />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'area']} label="面积(㎡)" rules={[{ required: true }]}>
                      <InputNumber min={0} precision={1} style={{ width: 120 }} />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'price']} label="价格(元/晚)" rules={[{ required: true }]}>
                      <InputNumber min={0} precision={2} style={{ width: 120 }} />
                    </Form.Item>

                    <Form.Item {...restField} name={[name, 'bedType']} label="床型" rules={[{ required: true }]}>
                      <Select placeholder="请选择" style={{ width: 120 }}>
                        {bedTypeOptions.map(item => (
                          <Option key={item.value} value={item.value}>{item.label}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Button type="text" danger icon={<MinusOutlined />} onClick={() => remove(name)}>
                      删除
                    </Button>
                  </Space>
                ))}

                <Form.Item>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()}>
                    添加房型
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          {/* 图片上传 */}
          <Divider orientation="left">酒店图片</Divider>
          <Form.Item label="上传酒店图片">
            <Upload
              listType="picture-card"
              fileList={imageFileList}
              beforeUpload={beforeUpload}
              onRemove={handleRemove}
              action={() => {}} // 禁用自动上传
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>点击上传</div>
              </div>
            </Upload>
            <Text type="secondary" style={{ marginTop: 8 }}>
              支持多张上传，单张不超过2MB，格式为JPG/PNG
            </Text>
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item style={{ textAlign: 'center', marginTop: 20 }}>
            <Space size="middle">
              <Button type="primary" htmlType="submit" size="large" loading={loading}>
                保存修改
              </Button>
              <Button size="large" onClick={() => navigate('/server/hotel-list')}>
                取消返回
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default HotelEdit;