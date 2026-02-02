// 路由配置文件，团队所有页面的路由都在这里配置
import { createBrowserRouter } from 'react-router-dom';
// 引入默认页面（后续替换成你们写的页面，先占位）
import Login from '../views/Login'; // 公共登录页
import ManagerHome from '../views/manager/ManagerHome'; // 管理端首页
import UserHome from '../views/user/UserHome'; // 用户端首页

// 配置路由规则：路径→对应页面
const router = createBrowserRouter([
  {
    path: '/', // 项目默认打开登录页
    element: <Login />
  },
  {
    path: '/manager/home', // 管理端首页路径
    element: <ManagerHome />
  },
  {
    path: '/user/home', // 用户端首页路径
    element: <UserHome />
  }
]);

export default router;