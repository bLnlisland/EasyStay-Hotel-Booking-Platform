// 🔴 核心：路由守卫组件（控制角色访问权限）
const PrivateRoute = ({ children, requiredRole }) => {
  // 修复：优先从currentUser读取角色，兜底读role字段
  const currentUserStr = localStorage.getItem('currentUser');
  let currentRole = localStorage.getItem('role');
  
  // 从currentUser解析角色（防止role字段丢失）
  if (currentUserStr) {
    try {
      const currentUser = JSON.parse(currentUserStr);
      currentRole = currentUser.role || currentRole || 'merchant';
    } catch (e) {
      currentRole = 'merchant'; // 解析失败默认商户
    }
  }
  
  // 1. 未登录 → 强制跳登录页
  if (!currentRole) {
    return <Navigate to="/login" replace />;
  }

  // 2. 角色不匹配 → 跳对应角色的首页
  if (currentRole !== requiredRole) {
    const redirectPath = currentRole === 'admin' ? '/manager/home' : '/merchant/home';
    return <Navigate to={redirectPath} replace />;
  }

  // 3. 角色匹配 → 正常显示页面
  return children;
};