import React, { useState, useEffect } from 'react';
import { Table, Card, Typography, Button, Tag, Space, Modal } from 'antd'; // 替换message为Modal
import { useNavigate, useLocation } from 'react-router-dom';

const { Title } = Typography;

const HotelList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState([]);

  // 城市中英文映射
  const cityMap = {
    beijing: '北京',
    shanghai: '上海',
    guangzhou: '广州',
    shenzhen: '深圳'
  };

  // 设施值转中文（含旧数据兼容：wifi/parking 等；新数据直接存中文）
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

  // 🔥 新增：审核状态映射（和管理员端完全对齐）
  const auditStatusMap = {
    pending: { text: '审核中', color: 'orange' },
    pass: { text: '已通过', color: 'green' },
    reject: { text: '不通过', color: 'red' },
    // 兼容老数据
    '审核中': { text: '审核中', color: 'orange' },
    '已通过': { text: '已通过', color: 'green' },
    '不通过': { text: '不通过', color: 'red' }
  };

  // 🔥 新增：发布状态映射
  const publishStatusMap = {
    online: { text: '已上线', color: 'blue' },
    offline: { text: '已下线', color: 'default' }
  };

  // 🔥 核心修改：读取正确的本地存储数据（和管理员端共用）
  const loadHotels = () => {
    try {
      // 优先读取管理员同步的 hotelList，兼容老数据 merchantHotels
      let hotels = JSON.parse(localStorage.getItem('hotelList')) || [];
      if (hotels.length === 0) {
        hotels = JSON.parse(localStorage.getItem('merchantHotels')) || [];
        // 迁移老数据到新的存储字段
        localStorage.setItem('hotelList', JSON.stringify(hotels));
      }
      
      // 为老数据补充默认状态
      const hotelsWithStatus = hotels.map(hotel => ({
        ...hotel,
        // 兼容老数据的 status 字段
        auditStatus: hotel.auditStatus || hotel.status || 'pending',
        publishStatus: hotel.publishStatus || 'offline',
        rejectReason: hotel.rejectReason || ''
      }));
      
      setData(hotelsWithStatus);
      console.log('读取到的酒店数据（含同步状态）：', hotelsWithStatus);
    } catch (error) {
      // 替换message为Modal
      Modal.error({
        title: '读取失败',
        content: '读取酒店数据失败，请刷新页面重试',
        okText: '确定'
      });
      setData([]);
    }
  };

  // 路由变化 + 监听本地存储变化，实时同步管理员操作
  useEffect(() => {
    loadHotels();
    // 监听本地存储变化，管理员操作后实时更新
    window.addEventListener('storage', loadHotels);
    return () => window.removeEventListener('storage', loadHotels);
  }, [location.pathname]);

  // 删除酒店功能（同步更新共用的 hotelList）
  const handleDelete = (hotelId) => {
    // 二次确认删除
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该酒店信息吗？删除后无法恢复',
      okText: '确认删除',
      cancelText: '取消',
      onOk: () => {
        try {
          const hotels = JSON.parse(localStorage.getItem('hotelList')) || [];
          const newHotels = hotels.filter(item => item.id !== hotelId);
          localStorage.setItem('hotelList', JSON.stringify(newHotels));
          // 兼容老数据
          localStorage.setItem('merchantHotels', JSON.stringify(newHotels));
          setData(newHotels);
          Modal.success({
            title: '删除成功',
            content: '酒店数据已删除',
            okText: '确定'
          });
        } catch (error) {
          Modal.error({
            title: '删除失败',
            content: '删除酒店数据失败，请重试',
            okText: '确定'
          });
        }
      }
    });
  };

  // 表格列配置（增加同步状态显示）
  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'hotelName',
      key: 'hotelName',
      ellipsis: true
    },
    {
      title: '所在城市',
      dataIndex: 'city',
      key: 'city',
      render: (city) => cityMap[city] || city
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone'
    },
    {
      title: '核心设施',
      dataIndex: 'facilities',
      key: 'facilities',
      render: (facilities) => {
        const facList = facilities || [];
        return (
          <Space>
            {facList.slice(0, 3).map(fac => (
              <Tag key={fac} size="small">{facilityMap[fac] || fac}</Tag>
            ))}
            {facList.length > 3 && <Tag size="small">+{facList.length - 3}</Tag>}
          </Space>
        );
      }
    },
    {
      title: '审核状态',
      key: 'auditStatus', // 🔥 修改为和管理员端一致的字段
      render: (_, record) => {
        const status = record.auditStatus || record.status || 'pending';
        const statusConfig = auditStatusMap[status] || auditStatusMap['pending'];
        return (
          <div>
            <Tag color={statusConfig.color}>{statusConfig.text}</Tag>
            {/* 显示审核不通过原因 */}
            {status === 'reject' && record.rejectReason && (
              <div style={{ fontSize: 12, color: '#f50', marginTop: 4 }}>
                原因：{record.rejectReason}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '发布状态', // 🔥 新增：显示管理员的发布/下线状态
      key: 'publishStatus',
      render: (_, record) => {
        const status = record.publishStatus || 'offline';
        const statusConfig = publishStatusMap[status] || publishStatusMap['offline'];
        return <Tag color={statusConfig.color}>{statusConfig.text}</Tag>;
      }
    },
    {
      title: '录入时间',
      dataIndex: 'createTime',
      key: 'createTime'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            onClick={() => navigate(`/merchant/hotel-edit/${record.id}`)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card title={<Title level={3}>我的酒店列表</Title>} bordered={false}>
        <Space style={{ marginBottom: 20 }}>
          <Button 
            type="primary" 
            onClick={() => navigate('/merchant/hotel-add')}
          >
            新增酒店
          </Button>
          <Button onClick={() => navigate('/merchant/home')}>
            返回首页
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          bordered
          locale={{ emptyText: '暂无酒店数据，点击「新增酒店」录入' }}
        />
      </Card>
    </div>
  );
};

export default HotelList;
