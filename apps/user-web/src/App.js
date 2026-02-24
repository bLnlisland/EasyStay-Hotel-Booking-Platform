import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Search from "./pages/Search";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";

export default function App() {
  return (
    <BrowserRouter>
      {/* 👇 移动端外壳容器 */}
      <div
        style={{
          minHeight: "100vh",
          background: "#f5f5f5",
        }}
      >
        <div
          style={{
            maxWidth: 430,
            margin: "0 auto",
            minHeight: "100vh",
            background: "#fff",
          }}
        >
          <Routes>
            {/* 首页：酒店查询页 */}
            <Route path="/" element={<Navigate to="/search" replace />} />
            <Route path="/search" element={<Search />} />

            {/* 列表页 */}
            <Route path="/list" element={<Hotels />} />

            {/* 详情页 */}
            <Route path="/hotel/:id" element={<HotelDetail />} />

            {/* 兼容旧路径 */}
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />

            <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}