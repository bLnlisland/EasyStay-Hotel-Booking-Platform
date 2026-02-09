import React from 'react';
import { StrictMode } from 'react';
import AppRouter from './router'; // 只导入路由组件

// 核心：App组件只渲染路由，无其他内容
function App() {
  return (
    <StrictMode>
      <AppRouter /> {/* 路由是唯一根节点，确保上下文优先 */}
    </StrictMode>
  );
}

export default App;