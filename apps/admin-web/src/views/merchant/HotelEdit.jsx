import React, { useState, useEffect, useRef } from 'react';
import {
  Form, Input, Button, Select, Checkbox, InputNumber,
  Upload, Card, Typography, Space, Divider, Modal, message
} from 'antd';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { hotelApi } from '../../utils/request';
import './HotelAdd.css';

const { Title, Text } = Typography;
const { Option } = Select;

// 设施选项列表（与新增界面保持一致）
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

// 后端 Hotel 可更新字段名（用于合并时保留原值）
const BACKEND_HOTEL_FIELDS = [
  'name_zh', 'name_en', 'description', 'address', 'city', 'province',
  'star_rating', 'opening_year', 'facilities', 'status', 'rejection_reason',
  'contact_phone', 'contact_email', 'check_in_time', 'check_out_time', 'policy',
  'latitude', 'longitude'
];

const HotelEdit = () => {
  const [form] = Form.useForm();
  const [imageFileList, setImageFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hotelStatus, setHotelStatus] = useState('draft');
  const navigate = useNavigate();
  const { id } = useParams();
  // 保存加载时的完整后端数据，提交时合并回去，避免丢失未在表单中的字段
  const fullHotelRef = useRef(null);

  // 表单设施选项的 value 列表，用于校验和回填
  const facilityValues = ['wifi', 'parking', 'swimming_pool', 'gym', 'restaurant', 'meeting_room', 'business_center', 'airport_shuttle', 'laundry', 'car_hailing', 'accessible', '24h_frontdesk', 'luggage_storage', 'currency_exchange', 'travel_tickets'];

  // 将后端设施值转换为表单使用的格式（兼容数组/JSON 字符串/中文/英文）
  const normalizeFacilities = (facilities) => {
    let list = facilities;
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        list = [];
      }
    }
    if (!Array.isArray(list)) return [];
    const valueMap = {
      '免费WiFi': 'wifi', 'wifi': 'wifi',
      '停车场': 'parking', 'parking': 'parking',
      '游泳池': 'swimming_pool', 'swimming_pool': 'swimming_pool',
      '健身房': 'gym', 'gym': 'gym',
      '餐厅': 'restaurant', 'restaurant': 'restaurant',
      '会议室': 'meeting_room', 'meeting_room': 'meeting_room',
      '商务中心': 'business_center', 'business_center': 'business_center',
      '机场接送': 'airport_shuttle', 'airport_shuttle': 'airport_shuttle',
      '洗衣服务': 'laundry', 'laundry': 'laundry',
      '叫车服务': 'car_hailing', 'car_hailing': 'car_hailing',
      '无障碍设施': 'accessible', 'accessible': 'accessible',
      '24小时前台': '24h_frontdesk', '24h_frontdesk': '24h_frontdesk',
      '行李寄存': 'luggage_storage', 'luggage_storage': 'luggage_storage',
      '外币兑换': 'currency_exchange', 'currency_exchange': 'currency_exchange',
      '旅游票务': 'travel_tickets', 'travel_tickets': 'travel_tickets'
    };
    const out = list.map(f => valueMap[f] || f).filter(Boolean);
    return out.filter(v => facilityValues.includes(v));
  };

  // 将后端房型数据转换为表单格式（兼容详情接口、列表、本地）
  const normalizeRoomTypes = (raw) => {
    const toNum = (v) => (v === undefined || v === null ? 0 : Number(v));
    if (raw.room_types && Array.isArray(raw.room_types)) {
      return raw.room_types.map(rt => ({
        name: rt.name || '',
        base_price: toNum(rt.base_price ?? rt.original_price ?? rt.price),
        discount_rate: Math.min(1, Math.max(0.1, toNum(rt.discount_rate ?? 1)))
      }));
    }
    if (raw.roomList && Array.isArray(raw.roomList)) {
      return raw.roomList.map(rt => ({
        name: rt.roomName || rt.name || '',
        base_price: toNum(rt.price ?? rt.base_price),
        discount_rate: Math.min(1, Math.max(0.1, toNum(rt.discount_rate ?? 1)))
      }));
    }
    return [{ name: '', base_price: 0, discount_rate: 0 }];
  };

  const normalizeToFormHotel = (raw) => {
    if (!raw) return null;
    const from = raw.dataValues || raw;
    const facilitiesRaw = from.facilities ?? raw.facilities;
    return {
      id: raw.id,
      hotelName: from.name_zh || raw.hotelName || '',
      city: from.city || raw.city || '',
      address: from.address || raw.address || '',
      star_rating: from.star_rating ?? raw.star_rating ?? 3,
      facilities: normalizeFacilities(facilitiesRaw || []),
      room_types: normalizeRoomTypes(raw),
      images: from.images ?? raw.images ?? [],
      status: from.status ?? raw.status,
      auditStatus: from.status ?? raw.status ?? raw.auditStatus
    };
  };

  // 把任意来源的酒店转成后端格式的纯对象（用于 fullHotelRef）
  const toBackendShape = (raw) => {
    if (!raw) return null;
    const fromApi = raw.dataValues || raw;
    return {
      name_zh: fromApi.name_zh ?? raw.hotelName,
      name_en: fromApi.name_en,
      description: fromApi.description ?? raw.description,
      address: fromApi.address ?? raw.address,
      city: fromApi.city ?? raw.city,
      province: fromApi.province ?? raw.province,
      star_rating: fromApi.star_rating ?? raw.star_rating,
      opening_year: fromApi.opening_year ?? raw.opening_year,
      facilities: fromApi.facilities ?? raw.facilities,
      status: fromApi.status ?? raw.status,
      rejection_reason: fromApi.rejection_reason ?? raw.rejection_reason,
      contact_phone: fromApi.contact_phone ?? raw.contactPhone,
      contact_email: fromApi.contact_email ?? raw.contact_email,
      check_in_time: fromApi.check_in_time ?? raw.check_in_time,
      check_out_time: fromApi.check_out_time ?? raw.check_out_time,
      policy: fromApi.policy ?? raw.policy,
      latitude: fromApi.latitude ?? raw.latitude,
      longitude: fromApi.longitude ?? raw.longitude
    };
  };

  const loadHotelData = async () => {
    try {
      setLoading(true);
      let targetHotel = null;
      let rawSource = null;

      // 1. 优先用「单个酒店详情」接口，带房型等完整信息
      try {
        const detailRes = await hotelApi.getHotelDetail(id);
        if (detailRes.success && detailRes.data) {
          rawSource = detailRes.data;
          targetHotel = normalizeToFormHotel(rawSource);
        }
      } catch (e) {
        console.warn('获取酒店详情失败，尝试列表接口', e);
      }

      // 2. 若无详情则从「我的酒店列表」里按 id 取一条
      if (!targetHotel) {
        try {
          const res = await hotelApi.getMyHotels();
          if (res.success && Array.isArray(res.data)) {
            const found = res.data.find(h => String(h.id) === String(id));
            if (found) {
              rawSource = found;
              targetHotel = normalizeToFormHotel(found);
            }
          }
        } catch (e2) {
          console.warn('列表接口失败，尝试本地数据', e2);
        }
      }

      // 3. 再尝试本地
      if (!targetHotel) {
        const merchantHotelsStr = localStorage.getItem('merchantHotels');
        const existingHotels = merchantHotelsStr ? JSON.parse(merchantHotelsStr) : [];
        const local = existingHotels.find(h => h.id.toString() === id.toString());
        if (local) {
          rawSource = local;
          targetHotel = normalizeToFormHotel(local);
        }
      }

      if (!targetHotel) {
        message.error('未找到该酒店信息！');
        navigate('/merchant/hotel-list');
        setLoading(false);
        return;
      }

      fullHotelRef.current = toBackendShape(rawSource);

      const facilities = Array.isArray(targetHotel.facilities) ? [...targetHotel.facilities] : [];
      const roomTypes = targetHotel.room_types && targetHotel.room_types.length > 0
        ? targetHotel.room_types
        : [{ name: '', base_price: 0, discount_rate: 0 }];

      // 先 reset 再 set，确保 Form.List 能正确渲染多条房型
      form.resetFields();
      form.setFieldsValue({
        hotelName: targetHotel.hotelName || '',
        city: targetHotel.city || '',
        address: targetHotel.address || '',
        star_rating: targetHotel.star_rating ?? 3,
        facilities,
        room_types: roomTypes
      });
      // 设施勾选易被 reset 或初次渲染覆盖，单独再设一次确保回显
      requestAnimationFrame(() => {
        form.setFieldValue('facilities', facilities);
      });

      const initImageList = [];
      const imgs = targetHotel.images || [];
      imgs.forEach((url, index) => {
        const src = typeof url === 'string' ? url : (url?.url || url?.image_url || '');
        if (src) {
          initImageList.push({
            uid: `img-${index}-${Date.now()}`,
            name: `酒店图片${index + 1}`,
            status: 'done',
            url: src
          });
        }
      });
      setImageFileList(initImageList);
      setHotelStatus(targetHotel.status || targetHotel.auditStatus || 'draft');
    } catch (error) {
      console.error('加载酒店数据失败：', error);
      message.error('加载失败，请刷新页面重试！');
      navigate('/merchant/hotel-list');
    } finally {
      setLoading(false);
    }
  };

  // 初始化 + 监听刷新
  useEffect(() => {
    loadHotelData();
    // 监听本地存储变化
    const handleStorage = () => loadHotelData();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅随 id 变化加载，loadHotelData 内部依赖稳定
  }, [id]);

  // 图片预览方法（禁用实际预览）
  const handlePreview = async (file) => {
    message.info('图片上传功能暂未启用，调试期间无需上传');
    return false;
  };

  // 禁用文件上传：直接提示并返回false（与新增界面保持一致）
  const beforeUpload = (file) => {
    message.info('图片上传功能暂未启用，调试期间无需上传');
    return false;
  };

  // 保留图片列表变化方法
  const handleImageChange = ({ fileList }) => {
    setImageFileList(fileList);
  };

  // 提交审核功能
  const handleSubmitForReview = async () => {
    Modal.confirm({
      title: '确认提交审核',
      content: '提交后，管理员将审核您的酒店信息。确认提交吗？',
      okText: '确认提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          setSubmitting(true);
          const response = await hotelApi.submitForReview(id);
          if (response.success) {
            Modal.success({
              title: '提交成功',
              content: response.message || '酒店已提交审核，请等待管理员审核',
              okText: '确定',
              onOk: () => {
                // 跳转回列表页
                navigate('/merchant/hotel-list');
              }
            });
          } else {
            Modal.error({
              title: '提交失败',
              content: response.message || '提交审核失败，请重试',
              okText: '确定'
            });
          }
        } catch (error) {
          console.error('提交审核失败：', error);
          Modal.error({
            title: '提交失败',
            content: error.response?.data?.message || '网络错误，请稍后重试',
            okText: '确定'
          });
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  // 保存：在原有完整数据上合并表单修改，再调用 PUT /api/hotels/:id
  const onFinish = async (values) => {
    // 移除图片必填验证，与新增界面保持一致

    const base = fullHotelRef.current ? { ...fullHotelRef.current } : {};
    const merged = {
      ...base,
      name_zh: values.hotelName,
      city: values.city,
      address: values.address,
      star_rating: values.star_rating ?? base.star_rating ?? 3,
      facilities: Array.isArray(values.facilities) ? values.facilities : (base.facilities || [])
    };
    const payload = {};
    BACKEND_HOTEL_FIELDS.forEach(key => {
      if (merged[key] !== undefined) payload[key] = merged[key];
    });
    if (Array.isArray(values.room_types)) {
      payload.room_types = values.room_types;
    }

    try {
      setLoading(true);
      const res = await hotelApi.updateHotel(id, payload);

      if (res.success && res.data) {
        message.success(res.message || '酒店更新成功！');
        // 不更新本地存储，让列表页从接口重新加载最新数据，避免重复记录
        setTimeout(() => navigate('/merchant/hotel-list'), 400);
      } else {
        message.error(res.message || '更新失败，请重试');
      }
    } catch (error) {
      console.error('保存失败：', error);
      message.error(error.response?.data?.message || error.message || '修改失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hotel-add-container">
      <Card title={<Title level={3}>编辑酒店（商户）</Title>} bordered={false}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
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

          {/* 酒店图片（调试期间无需上传） */}
          <Divider orientation="left">酒店图片（调试期间无需上传）</Divider>
          <Form.Item
            label="上传酒店图片"
            rules={[]}
          >
            <Upload
              name="file"
              listType="picture-card"
              fileList={imageFileList}
              beforeUpload={beforeUpload}
              onChange={handleImageChange}
              onPreview={handlePreview}
              multiple
              action={() => {}}
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
              <Button type="primary" htmlType="submit" size="large" loading={loading}>
                保存修改
              </Button>
              {hotelStatus === 'draft' && (
                <Button 
                  type="primary" 
                  size="large" 
                  loading={submitting}
                  onClick={handleSubmitForReview}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  提交审核
                </Button>
              )}
              <Button size="large" onClick={() => navigate('/merchant/hotel-list')}>
                返回列表
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default HotelEdit;
