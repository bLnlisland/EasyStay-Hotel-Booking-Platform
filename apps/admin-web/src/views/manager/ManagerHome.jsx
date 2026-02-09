import React from 'react';
import { Button, Modal } from 'antd'; // 引入Modal用于二次确认
import { Link, useNavigate } from 'react-router-dom';

const ManagerHome = () => {
  // 1. 顶层调用useNavigate，符合Hooks规则
  const navigate = useNavigate();

  // 2. 管理员退出登录逻辑（带二次确认+保留本地数据）
  const handleLogout = () => {
    // 二次确认弹窗
    Modal.confirm({
      title: '确认退出登录',
      content: '确定要退出管理员账号吗？系统所有数据会被保留，再次登录即可继续操作',
      okText: '确认退出',
      cancelText: '取消',
      // 确认退出的逻辑
      onOk: () => {
        try {
          // 只清除登录状态数据（保留业务数据）
          localStorage.removeItem('role');
          localStorage.removeItem('currentUser');
          localStorage.removeItem('token');

          // 跳转到登录页，replace防止回退
          navigate('/', { replace: true });
          // 退出成功提示
          Modal.success({
            content: '退出登录成功！系统数据已保留',
            okText: '确定'
          });
        } catch (error) {
          // 容错处理：跳转失败时用window.location兜底
          console.error('管理员退出登录失败：', error);
          window.location.href = '/';
        }
      },
      // 取消退出的回调（可选，可留空）
      onCancel: () => {
        Modal.info({
          content: '已取消退出登录',
          okText: '确定'
        });
      }
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>酒店预订系统-管理端</h1>
      <p>欢迎回来，您可以在这里审核商户提交的酒店信息</p>

      {/* 跳转到审核列表按钮 */}
      <div style={{ marginTop: '30px' }}>
        <Link to="/manager/hotel-audit">
          <Button type="primary" size="large">
            进入酒店审核列表
          </Button>
        </Link>
      </div>

      {/* 退出登录按钮（危险样式+二次确认） */}
      <div style={{ marginTop: '16px' }}>
        <Button 
          onClick={handleLogout} 
          size="large"
          danger // 危险按钮样式，提示敏感操作
        >
          退出登录
        </Button>
      </div>
    </div>
  );
};

export default ManagerHome;