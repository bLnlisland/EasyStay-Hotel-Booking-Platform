import React from 'react';
import { useRouteError } from 'react-router-dom';

// 错误边界：捕获路由渲染错误并展示，便于调试
const ErrorFallback = () => {
  const error = useRouteError();
  console.error('Route error:', error);
  return (
    <div style={{ 
      padding: '40px', 
      maxWidth: '800px', 
      margin: '50px auto',
      background: '#fff2f0',
      border: '1px solid #ffccc7',
      borderRadius: 8
    }}>
      <h1 style={{ color: '#cf1322', marginBottom: 16 }}>页面加载出错</h1>
      <pre style={{ 
        background: '#fff', 
        padding: 16, 
        overflow: 'auto', 
        fontSize: 12,
        color: '#333'
      }}>
        {error?.message || String(error)}
      </pre>
      <button
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: 16,
          padding: '8px 16px',
          background: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        返回首页
      </button>
    </div>
  );
};

export default ErrorFallback;
