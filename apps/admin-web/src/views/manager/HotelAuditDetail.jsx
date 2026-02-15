import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Form, Select, Input, Button, Modal, Space, Tag, Divider } from 'antd';
import { useNavigate, useParams, Link } from 'react-router-dom';

const { Title, Text } = Typography;

// 状态枚举（全局统一）
const AUDIT_STATUS = {
  PENDING: 'pending',
  PASS: 'pass',
  REJECT: 'reject'
};

const PUBLISH_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};

// 状态文本映射
const STATUS_TEXT = {
  [AUDIT_STATUS.PENDING]: '审核中',
  [AUDIT_STATUS.PASS]: '已通过',
  [AUDIT_STATUS.REJECT]: '不通过',
  [PUBLISH_STATUS.ONLINE]: '已上线',
  [PUBLISH_STATUS.OFFLINE]: '已下线'
};

// 设施映射（含旧数据兼容；新数据与 API 一致，直接存中文）
const facilityMap = {
  wifi: '免费WiFi',
  parking: '停车场',
  breakfast: '早餐服务',
  elevator: '电梯',
  airCondition: '空调',
  hotWater: '热水',
  laundry: '洗衣服务',
  gym: '健身房',
  '免费WiFi': '免费WiFi',
  '停车场': '停车场',
  '游泳池': '游泳池',
  '健身房': '健身房',
  '餐厅': '餐厅',
  '会议室': '会议室',
  '商务中心': '商务中心',
  '机场接送': '机场接送',
  '洗衣服务': '洗衣服务',
  '叫车服务': '叫车服务',
  '无障碍设施': '无障碍设施',
  '24小时前台': '24小时前台',
  '行李寄存': '行李寄存',
  '外币兑换': '外币兑换',
  '旅游票务': '旅游票务'
};

// 城市映射
const cityMap = {
  beijing: '北京',
  shanghai: '上海',
  guangzhou: '广州',
  shenzhen: '深圳'
};

const HotelAuditDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // 获取URL中的酒店ID
  const [form] = Form.useForm();
  const [hotelInfo, setHotelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 🔥 核心：加载酒店详情 + 监听本地存储变化，实时同步
  const loadHotelDetail = () => {
    try {
      setLoading(true);
      setError('');

      // 1. 多来源读取 + 容错（同步本地存储）
      let hotelData = [];
      const hotelListData = localStorage.getItem('hotelList');
      const merchantHotelsData = localStorage.getItem('merchantHotels');

      if (hotelListData) hotelData = JSON.parse(hotelListData) || [];
      if (hotelData.length === 0 && merchantHotelsData) hotelData = JSON.parse(merchantHotelsData) || [];

      // 在查找酒店时，将字符串ID转为数字
        const targetHotel = hotelData.find(hotel => hotel && String(hotel.id) === id);
      
      if (!targetHotel) {
        setError('未找到该酒店的信息，可能已被删除或ID错误');
        setHotelInfo(null);
        return;
      }

      // 3. 数据格式化 + 补充默认值（高容错）
      const formattedHotel = {
        id: targetHotel.id,
        hotelName: targetHotel.hotelName || '未知酒店',
        merchantName: targetHotel.merchantName || targetHotel.merchant || '未知商户',
        city: cityMap[targetHotel.city] || targetHotel.city || '未填写',
        address: targetHotel.address || '未填写',
        contactPhone: targetHotel.contactPhone || targetHotel.phone || '未填写',
        roomCount: targetHotel.roomCount || '未填写',
        priceRange: targetHotel.priceRange || '未填写',
        facilities: targetHotel.facilities || [],
        createTime: targetHotel.createTime || targetHotel.applyTime || '未填写',
        auditStatus: targetHotel.auditStatus || AUDIT_STATUS.PENDING,
        publishStatus: targetHotel.publishStatus || PUBLISH_STATUS.OFFLINE,
        rejectReason: targetHotel.rejectReason || ''
      };

      setHotelInfo(formattedHotel);
      // 表单回显当前状态（同步本地最新状态）
      form.setFieldsValue({
        auditStatus: formattedHotel.auditStatus,
        rejectReason: formattedHotel.rejectReason
      });

    } catch (err) {
      console.error('加载酒店详情失败：', err);
      setError('加载酒店信息失败，请返回列表页重试');
      setHotelInfo(null);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载 + 监听本地存储变化，实时同步
  useEffect(() => {
    loadHotelDetail();
    // 🔥 关键：监听localStorage变化，实时更新详情页
    window.addEventListener('storage', loadHotelDetail);
    // 监听路由参数变化（比如同一页面切换酒店ID）
    window.addEventListener('popstate', loadHotelDetail);
    
    // 清理监听
    return () => {
      window.removeEventListener('storage', loadHotelDetail);
      window.removeEventListener('popstate', loadHotelDetail);
    };
  }, [id, form]);

  // 🔥 核心：提交审核结果，同步到本地存储（双向同步）
  const handleAuditSubmit = () => {
    if (!hotelInfo) {
      Modal.warning({ title: '操作失败', content: '未获取到酒店信息，无法审核', okText: '确定' });
      return;
    }

    form.validateFields().then(values => {
      try {
        // 1. 读取全部酒店数据（多来源）
        let allHotels = [];
        const hotelListData = localStorage.getItem('hotelList');
        const merchantHotelsData = localStorage.getItem('merchantHotels');

        if (hotelListData) allHotels = JSON.parse(hotelListData) || [];
        if (allHotels.length === 0 && merchantHotelsData) allHotels = JSON.parse(merchantHotelsData) || [];

        // 2. 更新当前酒店的审核状态（同步修改）
        const updatedHotels = allHotels.map(hotel => {
          if (hotel && String(hotel.id) === String(id)) {
            return {
              ...hotel,
              auditStatus: values.auditStatus,
              rejectReason: values.auditStatus === AUDIT_STATUS.REJECT ? values.rejectReason : '',
              // 审核不通过时强制下线，只有审核通过才能由管理员选择上线
              publishStatus: values.auditStatus === AUDIT_STATUS.REJECT ? PUBLISH_STATUS.OFFLINE : (hotel.publishStatus || PUBLISH_STATUS.OFFLINE),
              auditTime: new Date().toLocaleString()
            };
          }
          return hotel;
        });

        // 3. 🔥 双向同步到本地存储（确保商户端/列表页都能读到）
        localStorage.setItem('hotelList', JSON.stringify(updatedHotels));
        localStorage.setItem('merchantHotels', JSON.stringify(updatedHotels));
        
        // 4. 触发storage事件，通知其他页面更新
        window.dispatchEvent(new Event('storage'));

        // 5. 提示 + 跳转回列表页
        Modal.success({
          title: '审核成功',
          content: `酒店【${hotelInfo.hotelName}】已${values.auditStatus === AUDIT_STATUS.PASS ? '审核通过' : '审核不通过'}，状态已同步到商户端`,
          okText: '确定',
          onOk: () => navigate('/manager/hotel-audit') // 审核完成后返回列表页
        });

        // 6. 实时更新当前页面的状态
        setHotelInfo(prev => ({
          ...prev,
          auditStatus: values.auditStatus,
          rejectReason: values.auditStatus === AUDIT_STATUS.REJECT ? values.rejectReason : '',
          publishStatus: values.auditStatus === AUDIT_STATUS.REJECT ? PUBLISH_STATUS.OFFLINE : (prev.publishStatus || PUBLISH_STATUS.OFFLINE)
        }));

      } catch (err) {
        console.error('提交审核失败：', err);
        Modal.error({
          title: '审核失败',
          content: '保存审核结果失败，请重试',
          okText: '确定'
        });
      }
    }).catch(errorInfo => {
      // 表单验证失败提示
      Modal.error({
        title: '验证失败',
        content: '请选择审核结果（不通过时必须填写原因）',
        okText: '确定'
      });
    });
  };

  // 管理员选择上线/下线（仅审核通过的酒店可操作）
  const handlePublishToggle = () => {
    if (!hotelInfo) return;
    const isOnline = hotelInfo.publishStatus === PUBLISH_STATUS.ONLINE;
    const action = isOnline ? '下线' : '上线';
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要将酒店【${hotelInfo.hotelName}】${action}吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        try {
          let allHotels = [];
          const hotelListData = localStorage.getItem('hotelList');
          const merchantHotelsData = localStorage.getItem('merchantHotels');
          if (hotelListData) allHotels = JSON.parse(hotelListData) || [];
          if (allHotels.length === 0 && merchantHotelsData) allHotels = JSON.parse(merchantHotelsData) || [];

          const newStatus = isOnline ? PUBLISH_STATUS.OFFLINE : PUBLISH_STATUS.ONLINE;
          const updatedHotels = allHotels.map(hotel => {
            if (hotel && String(hotel.id) === String(id)) {
              return { ...hotel, publishStatus: newStatus };
            }
            return hotel;
          });

          localStorage.setItem('hotelList', JSON.stringify(updatedHotels));
          localStorage.setItem('merchantHotels', JSON.stringify(updatedHotels));
          window.dispatchEvent(new Event('storage'));

          setHotelInfo(prev => ({ ...prev, publishStatus: newStatus }));
          Modal.success({ content: `${action}成功` });
        } catch (err) {
          console.error('操作失败：', err);
          Modal.error({ content: `${action}失败，请重试` });
        }
      }
    });
  };

  // 渲染设施标签
  const renderFacilities = (facilities) => {
    if (!Array.isArray(facilities) || facilities.length === 0) return '未填写';
    return (
      <Space size="small">
        {facilities.map(fac => (
          <Tag key={fac} size="small">{facilityMap[fac] || fac}</Tag>
        ))}
      </Space>
    );
  };

  // 加载中/错误状态
  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>加载酒店详情中...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <Text type="danger">{error}</Text>
        <div style={{ marginTop: 20 }}>
          <Button onClick={() => navigate('/manager/hotel-audit')}>返回审核列表</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* 顶部导航：返回列表页 */}
      <div style={{ marginBottom: 20 }}>
        <Button onClick={() => navigate('/manager/hotel-audit')} type="default">
          ← 返回审核列表
        </Button>
      </div>

      <Card bordered={false}>
        <Title level={4} style={{ marginBottom: 20 }}>
          酒店审核详情 - {hotelInfo.hotelName}
        </Title>

        {/* 酒店基础信息（实时同步本地存储） */}
        <Descriptions
          title="基础信息"
          bordered
          column={{ xs: 1, sm: 2, md: 3, lg: 3 }}
          style={{ marginBottom: 30 }}
        >
          <Descriptions.Item label="酒店ID">{hotelInfo.id}</Descriptions.Item>
          <Descriptions.Item label="商户名称">{hotelInfo.merchantName}</Descriptions.Item>
          <Descriptions.Item label="所在城市">{hotelInfo.city}</Descriptions.Item>
          <Descriptions.Item label="酒店地址" span={3}>{hotelInfo.address}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{hotelInfo.contactPhone}</Descriptions.Item>
          <Descriptions.Item label="房间数量">{hotelInfo.roomCount}</Descriptions.Item>
          <Descriptions.Item label="价格区间">{hotelInfo.priceRange}</Descriptions.Item>
          <Descriptions.Item label="核心设施" span={3}>
            {renderFacilities(hotelInfo.facilities)}
          </Descriptions.Item>
          <Descriptions.Item label="录入时间">{hotelInfo.createTime}</Descriptions.Item>
          <Descriptions.Item label="当前审核状态">
            <Tag color={hotelInfo.auditStatus === AUDIT_STATUS.PASS ? 'green' : hotelInfo.auditStatus === AUDIT_STATUS.REJECT ? 'red' : 'orange'}>
              {STATUS_TEXT[hotelInfo.auditStatus]}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="当前发布状态">
            <Tag color={hotelInfo.publishStatus === PUBLISH_STATUS.ONLINE ? 'blue' : 'default'}>
              {STATUS_TEXT[hotelInfo.publishStatus]}
            </Tag>
          </Descriptions.Item>
          {hotelInfo.auditStatus === AUDIT_STATUS.REJECT && (
            <Descriptions.Item label="历史不通过原因" span={3}>
              <Text type="danger">{hotelInfo.rejectReason || '无'}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Divider />

        {/* 审核操作表单（同步本地最新状态） */}
        <Title level={5} style={{ marginBottom: 20 }}>审核操作</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAuditSubmit}
          autoComplete="off"
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            name="auditStatus"
            label="审核结果"
            rules={[{ required: true, message: '请选择审核结果' }]}
          >
            <Select placeholder="请选择审核结果">
              <Select.Option value={AUDIT_STATUS.PASS}>通过</Select.Option>
              <Select.Option value={AUDIT_STATUS.REJECT}>不通过</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="rejectReason"
            label="不通过原因"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (getFieldValue('auditStatus') === AUDIT_STATUS.REJECT && !value) {
                    return Promise.reject(new Error('请填写不通过原因'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="请详细填写不通过原因，便于商户修改（审核通过时无需填写）"
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交审核结果</Button>
              <Button onClick={() => navigate('/manager/hotel-audit')}>取消</Button>
              <Link to="/manager/hotel-audit">
                <Button type="text">返回审核列表</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>

        {/* 上下线操作：仅审核通过的酒店可由管理员选择上线/下线 */}
        {hotelInfo.auditStatus === AUDIT_STATUS.PASS && (
          <>
            <Divider />
            <Title level={5} style={{ marginBottom: 16 }}>发布操作</Title>
            <Space>
              <Button
                type={hotelInfo.publishStatus === PUBLISH_STATUS.ONLINE ? 'default' : 'primary'}
                danger={hotelInfo.publishStatus === PUBLISH_STATUS.ONLINE}
                onClick={handlePublishToggle}
              >
                {hotelInfo.publishStatus === PUBLISH_STATUS.ONLINE ? '下线' : '上线'}
              </Button>
              <Text type="secondary">只有审核通过的酒店才可以上线</Text>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default HotelAuditDetail;