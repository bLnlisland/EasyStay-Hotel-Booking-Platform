import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Search from "./pages/Search";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 首页：酒店查询页 */}
        <Route path="/" element={<Navigate to="/search" replace />} />
        <Route path="/search" element={<Search />} />

        {/* 列表页 */}
        <Route path="/list" element={<Hotels />} />

        {/* 详情页 */}
        <Route path="/hotel/:id" element={<HotelDetail />} />

        {/* 兼容旧路径（可选但强烈建议，防止你现有跳转全炸） */}
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/hotels/:id" element={<HotelDetail />} />


        <Route path="*" element={<div style={{ padding: 16 }}>404</div>} />
      </Routes>
    </BrowserRouter>
  );
}
