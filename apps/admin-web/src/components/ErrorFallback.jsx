import React from 'react';
import { useRouteError } from 'react-router-dom';

// 错误边界：捕获路由渲染错误并展示，便于调试
const ErrorFallback = () => {
  const error = useRouteError();
  console.error('Route error:', error);
  return (
    <div className="auth-page">
      <div className="app-card auth-card" style={{ maxWidth: 560, padding: 32 }}>
        <h1 style={{ color: 'var(--text-title)', marginBottom: 16, fontSize: 20 }}>页面加载出错</h1>
        <pre style={{
          background: 'var(--bg-page)',
          padding: 16,
          overflow: 'auto',
          fontSize: 12,
          color: 'var(--text-body)',
          borderRadius: 8,
          border: '1px solid var(--border)'
        }}>
          {error?.message || String(error)}
        </pre>
        <button
          type="button"
          className="app-btn-primary"
          style={{ marginTop: 20, cursor: 'pointer' }}
          onClick={() => window.location.href = '/'}
        >
          返回首页
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;
