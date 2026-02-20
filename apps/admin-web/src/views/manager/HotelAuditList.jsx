import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Card, Typography, Modal } from 'antd';
import { useNavigate } from 'react-router-dom';
import { hotelApi } from '../../utils/request';

const { Title } = Typography;

// 状态枚举
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

// 状态显示映射
const STATUS_LABEL = {
  [AUDIT_STATUS.PENDING]: <Tag color="orange">审核中</Tag>,
  [AUDIT_STATUS.PASS]: <Tag color="green">已通过</Tag>,
  [AUDIT_STATUS.REJECT]: <Tag color="red">不通过</Tag>,
  [PUBLISH_STATUS.ONLINE]: <Tag color="blue">已上线</Tag>,
  [PUBLISH_STATUS.OFFLINE]: <Tag color="default">未上线</Tag>,
  [PUBLISH_STATUS.NA]: <Tag color="default">—</Tag>
};

// 后端 status 映射为审核状态；发布状态仅审核通过后才有意义，否则显示 —
const mapStatusToAudit = (status) => {
  if (status === 'approved' || status === 'offline') return AUDIT_STATUS.PASS;
  if (status === 'rejected') return AUDIT_STATUS.REJECT;
  return AUDIT_STATUS.PENDING;
};
// 仅当审核通过时根据 is_online 显示已上线/已下线；未通过则显示 —
const mapToPublishStatus = (status, isOnline) => {
  if (status === 'approved' || status === 'offline') {
    return isOnline === true ? PUBLISH_STATUS.ONLINE : PUBLISH_STATUS.OFFLINE;
  }
  return PUBLISH_STATUS.NA;
};

const HotelAuditList = () => {
  const navigate = useNavigate();
  const [hotelList, setHotelList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, total_pages: 0 });

  const loadFromApi = (page = 1, limit = 20, status) => {
    setLoading(true);
    hotelApi.getAdminAllHotels({ page, limit, status })
      .then((res) => {
        if (!res.success || !res.data) {
          setHotelList([]);
          return;
        }
        const { hotels = [], pagination: p } = res.data;
        setPagination({
          page: p.page,
          limit: p.limit,
          total: p.total,
          total_pages: p.total_pages
        });
        setHotelList(hotels.map(h => ({
          id: h.id,
          hotelName: h.name_zh || '未知酒店',
          merchantName: (h.merchant && h.merchant.username) || '未知商户',
          contactPhone: h.contact_phone || '未填写',
          createTime: h.created_at ? new Date(h.created_at).toLocaleString() : '未填写',
          auditStatus: mapStatusToAudit(h.status),
          publishStatus: mapToPublishStatus(h.status, h.is_online),
          rejectReason: ''
        })));
      })
      .catch((err) => {
        console.error('加载酒店列表失败：', err);
        setHotelList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFromApi(1, 20);
  }, []);

  // 表格列配置（仅展示核心信息，审核操作跳转到详情页）
  const columns = [
    { title: '酒店ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: '酒店名称', dataIndex: 'hotelName', key: 'hotelName', width: 180 },
    { title: '商户名称', dataIndex: 'merchantName', key: 'merchantName', width: 180 },
    { title: '联系电话', dataIndex: 'contactPhone', key: 'contactPhone', width: 120 },
    { title: '录入时间', dataIndex: 'createTime', key: 'createTime', width: 180 },
    {
      title: '审核状态',
      key: 'auditStatus',
      render: (_, record) => STATUS_LABEL[record.auditStatus],
      width: 100
    },
    {
      title: '发布状态',
      key: 'publishStatus',
      render: (_, record) => STATUS_LABEL[record.publishStatus],
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            size="small"
            onClick={() => navigate(`/manager/hotel-audit/${String(record.id)}`)}
          >
            审核
          </Button>
          {/* 上下线操作：仅审核通过的酒店可由管理员选择上线/下线 */}
          {record.auditStatus === AUDIT_STATUS.PASS && (
            <Button 
              size="small" 
              type={record.publishStatus === PUBLISH_STATUS.ONLINE ? 'default' : 'primary'}
              danger={record.publishStatus === PUBLISH_STATUS.ONLINE}
              onClick={() => handleQuickPublish(record)}
            >
              {record.publishStatus === PUBLISH_STATUS.ONLINE ? '下线' : '上线'}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // 管理员选择上线/下线（调用发布接口，与审核分离）
  const handleQuickPublish = (record) => {
    const isOnline = record.publishStatus === PUBLISH_STATUS.ONLINE;
    const action = isOnline ? '下线' : '上线';
    const newIsOnline = !isOnline;
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要将酒店【${record.hotelName}】${action}吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        hotelApi.updateAdminHotelPublish(record.id, { is_online: newIsOnline })
          .then(() => {
            Modal.success({ content: `${action}成功` });
            loadFromApi(pagination.page, pagination.limit);
          })
          .catch((err) => {
            console.error('操作失败：', err);
            Modal.error({ content: err?.message || `${action}失败，请重试` });
          });
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <Card bordered={false} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>酒店审核列表</Title>
          {/* Link返回管理员首页 */}
          <Button onClick={() => navigate('/manager/home')}>返回管理员首页</Button>
        </div>
      </Card>

      {/* 空列表提示（高容错） */}
      {hotelList.length === 0 ? (
        <Card bordered={false} style={{ textAlign: 'center', padding: '50px 0' }}>
          <Typography.Text type="secondary">暂无商户提交的酒店信息，请等待商户录入...</Typography.Text>
        </Card>
      ) : (
        <Table
          columns={columns}
          dataSource={hotelList}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, size) => loadFromApi(p, size || pagination.limit)
          }}
          bordered
          scroll={{ x: 'max-content' }}
        />
      )}
    </div>
  );
};

export default HotelAuditList;