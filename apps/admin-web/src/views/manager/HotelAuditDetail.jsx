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

// 设施映射
const facilityMap = {
  wifi: '免费WiFi',
  parking: '免费停车场',
  breakfast: '早餐服务',
  elevator: '电梯',
  airCondition: '空调',
  hotWater: '热水',
  laundry: '洗衣房',
  gym: '健身房'
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
          if (hotel.id === id) {
            return {
              ...hotel,
              auditStatus: values.auditStatus,
              rejectReason: values.auditStatus === AUDIT_STATUS.REJECT ? values.rejectReason : '',
              // 同步更新时间（可选）
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
          rejectReason: values.auditStatus === AUDIT_STATUS.REJECT ? values.rejectReason : ''
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

// 基础信息部分的开头，新增图片展示
<Descriptions
  title={
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      基础信息
      {hotelInfo.hotelImage && (
        <img
          src={hotelInfo.hotelImage}
          alt={hotelInfo.hotelName}
          style={{
            width: 80,
            height: 60,
            objectFit: 'cover',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          onClick={() => {
            Modal.info({
              title: hotelInfo.hotelName,
              content: <img src={hotelInfo.hotelImage} alt={hotelInfo.hotelName} style={{ width: '100%' }} />,
              width: 600,
            });
          }}
        />
      )}
      {/* 无图片时显示占位图 */}
      {!hotelInfo.hotelImage && (
        <div style={{
          width: 80,
          height: 60,
          backgroundColor: '#f5f5f5',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#999',
          fontSize: 12
        }}>
          暂无图片
        </div>
      )}
    </div>
  }
  bordered
  column={{ xs: 1, sm: 2, md: 3, lg: 3 }}
  style={{ marginBottom: 30 }}
>
  {/* 原有字段... */}
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
              {/* Link跳转回列表页（备用，同步路由） */}
              <Link to="/manager/hotel-audit">
                <Button type="text">返回审核列表</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default HotelAuditDetail;