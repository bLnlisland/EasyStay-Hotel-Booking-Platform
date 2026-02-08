import { useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Card, List, Tag, Carousel } from "antd";
import { mockHotels } from "../mock/hotels";

function getFallbackImages(hotelId) {
  // 用不同的 sig 生成稳定但不同的图（不依赖你 mock 字段）
  const base = "https://source.unsplash.com/1200x700/?hotel,room,lobby";
  const s = Number(hotelId) || 1;
  return [`${base}&sig=${s}`, `${base}&sig=${s + 11}`, `${base}&sig=${s + 22}`];
}

export default function HotelDetail() {
  const { id } = useParams();
  const [sp] = useSearchParams();

  const check_in = sp.get("check_in") || "";
  const check_out = sp.get("check_out") || "";
  const guests = sp.get("guests") || "2";

  const hotel = useMemo(() => {
    return mockHotels.find((h) => String(h.id) === String(id));
  }, [id]);

  if (!hotel) {
    return (
      <div style={{ padding: 16 }}>
        <div>未找到该酒店</div>
        <Link to="/list">返回列表</Link>
      </div>
    );
  }

  // ✅ 大图 Banner 数据：优先用 mock 里的 images，否则用兜底
  const images =
    (Array.isArray(hotel.images) && hotel.images.length ? hotel.images : null) ||
    getFallbackImages(hotel.id);

  const roomTypes = [
    {
      id: 101,
      name: "标准大床房",
      base_price: hotel.min_price,
      discounted_price: hotel.min_price,
      max_guests: 2,
      total_price: hotel.min_price,
    },
    {
      id: 102,
      name: "豪华双床房",
      base_price: hotel.min_price + 120,
      discounted_price: hotel.min_price + 80,
      max_guests: 3,
      total_price: hotel.min_price + 80,
    },
  ];

  // ✅ 返回列表：优先带着当前查询参数回 /list
  const backToList = sp.toString() ? `/list?${sp.toString()}` : "/list";

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to={backToList}>← 返回列表</Link>
      </div>

      {/* ✅ 轮动大图 Banner（左右滑 / 自动播放） */}
      <div style={{ marginBottom: 12, borderRadius: 12, overflow: "hidden" }}>
        <Carousel autoplay dots>
          {images.map((url, idx) => (
            <div key={`${url}-${idx}`}>
              <div
                style={{
                  height: 220,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url(${url})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  position: "relative",
                }}
              >
                {/* 底部轻提示（可删，但更像“有产品感”） */}
                <div
                  style={{
                    position: "absolute",
                    left: 12,
                    bottom: 10,
                    color: "#fff",
                    fontWeight: 600,
                    textShadow: "0 1px 6px rgba(0,0,0,0.35)",
                  }}
                >
                  {hotel.name_zh}
                </div>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      <Card title={hotel.name_zh}>
        <div>城市：{hotel.city}</div>
        <div>地址：{hotel.address}</div>
        <div>星级：{hotel.star_rating}</div>
        <div>起价：{hotel.min_price}</div>

        <div style={{ marginTop: 12 }}>
          <Tag>入住：{check_in || "未选择"}</Tag>
          <Tag>离店：{check_out || "未选择"}</Tag>
          <Tag>人数：{guests}</Tag>
        </div>

        <h3 style={{ marginTop: 16 }}>可选房型（Mock）</h3>
        <List
          dataSource={roomTypes}
          renderItem={(r) => (
            <List.Item>
              <div style={{ width: "100%" }}>
                <b>{r.name}</b>（最多 {r.max_guests} 人）
                <div>基础价：{r.base_price}</div>
                <div>折后价：{r.discounted_price}</div>
                <div>总价：{r.total_price}</div>
              </div>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
