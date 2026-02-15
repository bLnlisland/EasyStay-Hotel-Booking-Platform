import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Space, Card, Typography, Modal } from 'antd';
import { useNavigate, Link } from 'react-router-dom';

const { Title } = Typography;

// 状态枚举
const AUDIT_STATUS = {
  PENDING: 'pending',
  PASS: 'pass',
  REJECT: 'reject'
};

const PUBLISH_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};

// 状态显示映射
const STATUS_LABEL = {
  [AUDIT_STATUS.PENDING]: <Tag color="orange">审核中</Tag>,
  [AUDIT_STATUS.PASS]: <Tag color="green">已通过</Tag>,
  [AUDIT_STATUS.REJECT]: <Tag color="red">不通过</Tag>,
  [PUBLISH_STATUS.ONLINE]: <Tag color="blue">已上线</Tag>,
  [PUBLISH_STATUS.OFFLINE]: <Tag color="default">已下线</Tag>
};

const HotelAuditList = () => {
  const navigate = useNavigate();
  const [hotelList, setHotelList] = useState([]);

  // 加载商户数据（高容错：兼容多存储字段 + 数据校验）
  useEffect(() => {
    const loadMerchantHotelData = () => {
      try {
        // 1. 多来源读取 + 容错
        let hotelData = [];
        const hotelListData = localStorage.getItem('hotelList');
        const merchantHotelsData = localStorage.getItem('merchantHotels');

        if (hotelListData) hotelData = JSON.parse(hotelListData) || [];
        if (hotelData.length === 0 && merchantHotelsData) hotelData = JSON.parse(merchantHotelsData) || [];

        // 2. 数据清洗：过滤无效数据 + 补充默认字段
        const validHotels = hotelData
          .filter(hotel => hotel && hotel.id && hotel.hotelName) // 过滤空数据/无ID/无名称的无效数据
          .map(hotel => ({
            id: hotel.id,
            hotelName: hotel.hotelName || '未知酒店',
            merchantName: hotel.merchantName || hotel.merchant || '未知商户',
            contactPhone: hotel.contactPhone || hotel.phone || '未填写',
            createTime: hotel.createTime || hotel.applyTime || '未填写',
            auditStatus: hotel.auditStatus || AUDIT_STATUS.PENDING,
            publishStatus: hotel.publishStatus || PUBLISH_STATUS.OFFLINE,
            rejectReason: hotel.rejectReason || ''
          }));

        setHotelList(validHotels);
      } catch (error) {
        console.error('加载酒店数据失败：', error);
        setHotelList([]);
      }
    };

    loadMerchantHotelData();
    window.addEventListener('storage', loadMerchantHotelData);
    return () => window.removeEventListener('storage', loadMerchantHotelData);
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
          {/* 跳转到审核详情页 */}
          <Button 
            type="primary" 
            size="small"
            onClick={() => navigate(`/manager/hotel-audit/${String(record.id)}`)}
          >
            审核详情
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

  // 管理员选择上线/下线（仅审核通过的酒店可操作）
  const handleQuickPublish = (record) => {
    const isOnline = record.publishStatus === PUBLISH_STATUS.ONLINE;
    const action = isOnline ? '下线' : '上线';
    Modal.confirm({
      title: `确认${action}`,
      content: `确定要将酒店【${record.hotelName}】${action}吗？`,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        try {
          const updatedList = hotelList.map(hotel => {
            if (hotel.id === record.id) {
              return {
                ...hotel,
                publishStatus: hotel.publishStatus === PUBLISH_STATUS.ONLINE 
                  ? PUBLISH_STATUS.OFFLINE 
                  : PUBLISH_STATUS.ONLINE
              };
            }
            return hotel;
          });
          localStorage.setItem('hotelList', JSON.stringify(updatedList));
          localStorage.setItem('merchantHotels', JSON.stringify(updatedList));
          setHotelList(updatedList);
          Modal.success({ content: `${action}成功` });
        } catch (error) {
          console.error('操作失败：', error);
          Modal.error({ content: `${action}失败，请重试` });
        }
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
          pagination={{ pageSize: 10, showSizeChanger: true }}
          bordered
          scroll={{ x: 'max-content' }}
        />
      )}
    </div>
  );
};

export default HotelAuditList;