import React, { useState, useEffect } from 'react';
import { Card, Typography, Descriptions, Form, Select, Input, Button, Modal, Space, Tag, Divider, Image } from 'antd';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { hotelApi, BASE_URL } from '../../utils/request';

const { Title, Text } = Typography;

const getImageUrl = (url) => (url && url.startsWith('http') ? url : `${BASE_URL || ''}${url || ''}`);

// 状态枚举（全局统一）
const AUDIT_STATUS = {
  PENDING: 'pending',
  PASS: 'pass',
  REJECT: 'reject'
};

const PUBLISH_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  NA: 'na'  // 未审核通过，不适用上下线
};

// 状态文本映射
const STATUS_TEXT = {
  [AUDIT_STATUS.PENDING]: '审核中',
  [AUDIT_STATUS.PASS]: '已通过',
  [AUDIT_STATUS.REJECT]: '不通过',
  [PUBLISH_STATUS.ONLINE]: '已上线',
  [PUBLISH_STATUS.OFFLINE]: '未上线',
  [PUBLISH_STATUS.NA]: '—'
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

  // 后端 status 映射为审核状态；发布状态仅审核通过后才有意义，否则显示 —
  const statusToAudit = (s) => (s === 'approved' || s === 'offline' ? AUDIT_STATUS.PASS : s === 'rejected' ? AUDIT_STATUS.REJECT : AUDIT_STATUS.PENDING);
  const toPublishStatus = (status, isOnline) => {
    if (status === 'approved' || status === 'offline') return isOnline === true ? PUBLISH_STATUS.ONLINE : PUBLISH_STATUS.OFFLINE;
    return PUBLISH_STATUS.NA;
  };

  const loadHotelDetail = () => {
    setLoading(true);
    setError('');
    hotelApi.getAdminHotelDetail(id)
      .then((res) => {
        if (!res.success || !res.data) {
          setError('未找到该酒店的信息');
          setHotelInfo(null);
          return;
        }
        const raw = res.data;
        const facilities = Array.isArray(raw.facilities) ? raw.facilities : (typeof raw.facilities === 'string' ? (() => { try { return JSON.parse(raw.facilities); } catch { return []; } })() : []);
        const rooms = raw.room_types || [];
        const minPrice = rooms.length ? Math.min(...rooms.map(r => Number(r.base_price) || 0)) : null;
        const maxPrice = rooms.length ? Math.max(...rooms.map(r => Number(r.base_price) || 0)) : null;
        const priceRange = minPrice != null && maxPrice != null ? `${minPrice} - ${maxPrice} 元` : '未填写';
        const images = Array.isArray(raw.images) ? raw.images : [];
        const formattedHotel = {
          id: raw.id,
          hotelName: raw.name_zh || '未知酒店',
          merchantName: (raw.merchant && raw.merchant.username) || '未知商户',
          city: (raw.city && cityMap[raw.city]) ? cityMap[raw.city] : (raw.city || '未填写'),
          address: raw.address || '未填写',
          contactPhone: raw.contact_phone || '未填写',
          roomCount: rooms.length ? String(rooms.length) : '未填写',
          priceRange,
          facilities,
          images,
          createTime: (raw.created_at || raw.createdAt) ? new Date(raw.created_at || raw.createdAt).toLocaleString('zh-CN') : '未填写',
          auditStatus: statusToAudit(raw.status),
          publishStatus: toPublishStatus(raw.status, raw.is_online),
          rejectReason: raw.rejection_reason || raw.review_notes || ''
        };
        setHotelInfo(formattedHotel);
        form.setFieldsValue({
          auditStatus: AUDIT_STATUS.PASS,
          rejectReason: formattedHotel.rejectReason
        });
      })
      .catch((err) => {
        console.error('加载酒店详情失败：', err);
        setError(err?.message || '加载酒店信息失败，请返回列表页重试');
        setHotelInfo(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadHotelDetail();
  }, [id]);

  // 提交审核结果到后端
  const handleAuditSubmit = () => {
    if (!hotelInfo) {
      Modal.warning({ title: '操作失败', content: '未获取到酒店信息，无法审核', okText: '确定' });
      return;
    }
    form.validateFields().then((values) => {
      const status = values.auditStatus === AUDIT_STATUS.PASS ? 'approved' : 'rejected';
      const review_notes = values.auditStatus === AUDIT_STATUS.REJECT ? (values.rejectReason || '') : undefined;
      hotelApi.updateAdminHotelStatus(id, { status, review_notes })
        .then(() => {
          Modal.success({
            title: '审核成功',
            content: `酒店【${hotelInfo.hotelName}】已${values.auditStatus === AUDIT_STATUS.PASS ? '审核通过' : '审核不通过'}`,
            okText: '确定',
            onOk: () => navigate('/manager/hotel-audit')
          });
        })
        .catch((err) => {
          Modal.error({
            title: '审核失败',
            content: err?.message || '保存审核结果失败，请重试',
            okText: '确定'
          });
        });
    }).catch(() => {
      Modal.error({ title: '验证失败', content: '请选择审核结果（不通过时必须填写原因）', okText: '确定' });
    });
  };

  // 管理员选择上线/下线（调用发布接口，与审核分离）
  const handlePublishToggle = () => {
    if (!hotelInfo) return;
    const isOnline = hotelInfo.publishStatus === PUBLISH_STATUS.ONLINE;
    const action = isOnline ? '下线' : '上线';
    const newIsOnline = !isOnline;
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要将酒店【${hotelInfo.hotelName}】${action}吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        hotelApi.updateAdminHotelPublish(id, { is_online: newIsOnline })
          .then(() => {
            Modal.success({ content: `${action}成功` });
            loadHotelDetail();
          })
          .catch((err) => {
            Modal.error({ content: err?.message || `${action}失败，请重试` });
          });
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
    return (
      <div className="app-page">
        <Card className="app-card" style={{ padding: 50, textAlign: 'center' }}>加载酒店详情中...</Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-page">
        <Card className="app-card" style={{ padding: 50, textAlign: 'center' }}>
          <Text type="danger">{error}</Text>
          <div style={{ marginTop: 20 }}>
            <Button className="app-btn-default" onClick={() => navigate('/manager/hotel-audit')}>返回审核列表</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="app-page-header" style={{ marginBottom: 20 }}>
        <div className="app-page-title-wrap">
          <div className="app-page-icon">📋</div>
          <div>
            <h1 className="app-page-title">酒店审核详情</h1>
            <p className="app-page-subtitle">{hotelInfo.hotelName}</p>
          </div>
        </div>
        <Button className="app-btn-default" onClick={() => navigate('/manager/hotel-audit')}>
          ← 返回审核列表
        </Button>
      </div>

      <Card className="app-card" bordered={false} style={{ padding: '24px' }}>
        <Title level={5} style={{ marginBottom: 20, color: 'var(--text-title)' }}>
          基础信息与审核
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
              {STATUS_TEXT[hotelInfo.publishStatus] || '—'}
            </Tag>
          </Descriptions.Item>
          {hotelInfo.auditStatus === AUDIT_STATUS.REJECT && (
            <Descriptions.Item label="历史不通过原因" span={3}>
              <Text type="danger">{hotelInfo.rejectReason || '无'}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        {/* 酒店图片 */}
        <Divider />
        <Title level={5} style={{ marginBottom: 16 }}>酒店图片</Title>
        {hotelInfo.images && hotelInfo.images.length > 0 ? (
          <Image.PreviewGroup>
            <Space size={12} wrap style={{ marginBottom: 24 }}>
              {hotelInfo.images.map((img) => (
                <Image
                  key={img.id}
                  width={160}
                  height={120}
                  src={getImageUrl(img.url)}
                  alt={img.alt_text || `酒店图片${img.id}`}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
              ))}
            </Space>
          </Image.PreviewGroup>
        ) : (
          <Text type="secondary">暂无图片</Text>
        )}

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
              <Button type="primary" htmlType="submit" className="app-btn-primary">提交审核结果</Button>
              <Button className="app-btn-default" onClick={() => navigate('/manager/hotel-audit')}>取消</Button>
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