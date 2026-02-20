import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal } from 'antd';
import { PlusOutlined, HomeOutlined, EditOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { hotelApi } from '../../utils/request';
import './HotelList.css';

const HotelList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // 加载状态

  // 城市中英文映射
  const cityMap = {
    beijing: '北京',
    shanghai: '上海',
    guangzhou: '广州',
    shenzhen: '深圳'
  };

  // 设施值转中文（兼容新旧数据，列表展示时可使用）
  // eslint-disable-next-line no-unused-vars -- 保留供列表展示设施名称时使用
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

  // 审核状态映射（用于样式类名）
  const auditStatusMap = {
    draft: { text: '草稿', className: 'status-draft' },
    pending: { text: '审核中', className: 'status-pending' },
    under_review: { text: '审核中', className: 'status-under_review' },
    approved: { text: '已通过', className: 'status-approved' },
    rejected: { text: '已拒绝', className: 'status-rejected' },
    offline: { text: '已下线', className: 'status-offline' },
    pass: { text: '已通过', className: 'status-pass' },
    reject: { text: '不通过', className: 'status-reject' },
    '审核中': { text: '审核中', className: 'status-pending' },
    '已通过': { text: '已通过', className: 'status-approved' },
    '不通过': { text: '不通过', className: 'status-reject' }
  };

  const publishStatusMap = {
    online: { text: '已上线', className: 'status-online' },
    offline: { text: '已下线', className: 'status-offline' }
  };

  // 🔥 核心修改：从接口获取数据
  const loadHotels = async () => {
    setLoading(true);
    try {
      // 1. 使用封装好的接口方法（自动包含baseURL和token）
      const response = await hotelApi.getMyHotels();

      if (response.success) {
        // 2. 处理接口返回的数据，兼容本地字段名
        const apiData = response.data || [];
        const formattedData = apiData.map(item => ({
          id: item.id,
          hotelName: item.name_zh, // 接口字段name_zh映射到hotelName
          city: item.city,
          star_rating: item.star_rating,
          status: item.status, // 接口返回的审核状态
          // 兼容本地其他字段（如果接口未返回，可留空或从本地补充）
          contactPhone: item.contact_phone || '',
          facilities: item.facilities || [],
          auditStatus: item.status || 'pending',
          publishStatus: item.publish_status || 'offline',
          createTime: item.created_at ? new Date(item.created_at).toLocaleString('zh-CN') : '',
          rejectReason: item.reject_reason || ''
        }));

        // 3. 去重：按 id 去重，保留最新的记录（如果接口返回了重复数据）
        const uniqueMap = new Map();
        formattedData.forEach(item => {
          const existing = uniqueMap.get(item.id);
          if (!existing || (item.createTime && existing.createTime && item.createTime > existing.createTime)) {
            uniqueMap.set(item.id, item);
          }
        });
        const uniqueData = Array.from(uniqueMap.values());

        setData(uniqueData);
        // 同步更新本地存储（去重后的数据）
        localStorage.setItem('hotelList', JSON.stringify(uniqueData));
        localStorage.setItem('merchantHotels', JSON.stringify(uniqueData));
      } else {
        Modal.error({
          title: '获取失败',
          content: response.message || '获取酒店列表失败',
          okText: '确定'
        });
      }
    } catch (error) {
      console.error('获取酒店列表失败：', error);
      Modal.error({
        title: '获取失败',
        content: '网络错误或服务器异常，请稍后重试',
        okText: '确定'
      });
      // 降级：如果接口失败，尝试从本地存储读取旧数据
      const localData = JSON.parse(localStorage.getItem('hotelList')) || [];
      setData(localData);
    } finally {
      setLoading(false);
    }
  };

  // 提交审核功能
  const handleSubmitForReview = async (hotelId) => {
    Modal.confirm({
      title: '确认提交审核',
      content: '提交后，管理员将审核您的酒店信息。确认提交吗？',
      okText: '确认提交',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await hotelApi.submitForReview(hotelId);
          if (response.success) {
            Modal.success({
              title: '提交成功',
              content: response.message || '酒店已提交审核，请等待管理员审核',
              okText: '确定',
              onOk: () => {
                // 重新加载列表
                loadHotels();
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
        }
      }
    });
  };

  // 删除酒店：调用后端接口，成功后重新加载列表（避免重复草稿）
  const handleDelete = (hotelId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该酒店信息吗？删除后无法恢复',
      okText: '确认删除',
      cancelText: '取消',
      onOk: async () => {
        try {
          await hotelApi.deleteHotel(hotelId);
          Modal.success({
            title: '删除成功',
            content: '酒店已删除',
            okText: '确定',
            onOk: () => loadHotels()
          });
          loadHotels();
        } catch (error) {
          Modal.error({
            title: '删除失败',
            content: error.response?.data?.message || '删除失败，请重试',
            okText: '确定'
          });
        }
      }
    });
  };

  // 路由变化时重新加载数据
  useEffect(() => {
    loadHotels();
  }, [location.pathname]);

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'hotelName',
      key: 'hotelName',
      ellipsis: true,
      render: (name) => <span className="hotel-name-cell">{name || '—'}</span>
    },
    {
      title: '所在城市',
      dataIndex: 'city',
      key: 'city',
      render: (city) => cityMap[city] || city || '—'
    },
    {
      title: '酒店星级',
      dataIndex: 'star_rating',
      key: 'star_rating',
      render: (rating) => <span className="star-cell">{rating != null ? `${rating} 星` : '—'}</span>
    },
    {
      title: '审核状态',
      key: 'auditStatus',
      render: (_, record) => {
        const status = record.auditStatus || record.status || 'pending';
        const config = auditStatusMap[status] || auditStatusMap['pending'];
        return (
          <div>
            <span className={`status-tag ${config.className}`}>{config.text}</span>
            {(status === 'reject' || status === 'rejected') && record.rejectReason && (
              <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4 }}>
                原因：{record.rejectReason}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '发布状态',
      key: 'publishStatus',
      render: (_, record) => {
        const status = record.publishStatus || 'offline';
        const config = publishStatusMap[status] || publishStatusMap['offline'];
        return <span className={`status-tag ${config.className}`}>{config.text}</span>;
      }
    },
    {
      title: '录入时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 172,
      render: (t) => {
        if (!t) return '—';
        if (typeof t === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(t)) return new Date(t).toLocaleString('zh-CN');
        return t;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => {
        const status = record.auditStatus || record.status || 'draft';
        const canSubmit = status === 'draft';
        const canResubmit = status === 'rejected' || status === 'approved';
        // 草稿、审核中、已拒绝、已通过 均可编辑
        const canEdit = status === 'draft' || status === 'pending' || status === 'under_review' || status === 'rejected' || status === 'approved';
        return (
          <div className="action-btns">
            {canEdit && (
              <Button
                type="text"
                size="small"
                className="action-btn action-btn-edit"
                icon={<EditOutlined />}
                onClick={() => navigate(`/merchant/hotel-edit/${record.id}`)}
              >
                编辑
              </Button>
            )}
            {canSubmit && (
              <Button
                type="text"
                size="small"
                className="action-btn action-btn-submit"
                icon={<SendOutlined />}
                onClick={() => handleSubmitForReview(record.id)}
              >
                提交审核
              </Button>
            )}
            {canResubmit && (
              <Button
                type="text"
                size="small"
                className="action-btn action-btn-submit"
                icon={<SendOutlined />}
                onClick={() => handleSubmitForReview(record.id)}
              >
                重新提交审核
              </Button>
            )}
            {canEdit && (
              <Button
                type="text"
                size="small"
                className="action-btn action-btn-delete"
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id)}
              >
                删除
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div className="hotel-list-page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-icon">🏨</div>
          <div>
            <h1 className="page-title">我的酒店列表</h1>
            <p className="page-subtitle">管理您名下的酒店信息，提交审核后将在平台展示</p>
          </div>
        </div>
        <div className="header-actions">
          <Button
            type="primary"
            className="btn-add"
            icon={<PlusOutlined />}
            onClick={() => navigate('/merchant/hotel-add')}
          >
            新增酒店
          </Button>
          <Button
            className="btn-back"
            icon={<HomeOutlined />}
            onClick={() => navigate('/merchant/home')}
          >
            返回首页
          </Button>
        </div>
      </div>

      <Card className="list-card" bordered={false}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`
          }}
          loading={loading}
          locale={{ emptyText: '暂无酒店数据，点击「新增酒店」录入' }}
        />
      </Card>
    </div>
  );
};

export default HotelList;