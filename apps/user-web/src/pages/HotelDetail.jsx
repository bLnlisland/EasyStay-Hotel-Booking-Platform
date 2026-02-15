import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { mockHotels } from "../mock/hotels";
import { fetchHotelDetail } from "../api/hotels";
import { Card, List, Tag, Carousel, Spin, Alert, DatePicker } from "antd";
import { useHotelQueryParams } from "../hooks/useHotelQueryParams";

const { RangePicker } = DatePicker;

function getFallbackImages(hotelId) {
  const base = "https://source.unsplash.com/1200x700/?hotel,room,lobby";
  const s = Number(hotelId) || 1;
  return [`${base}&sig=${s}`, `${base}&sig=${s + 11}`, `${base}&sig=${s + 22}`];
}

// ✅ 小提示：Vite 通常要 VITE_ 前缀
const USE_MOCK = import.meta.env.APP_USE_MOCK === "true";

export default function HotelDetail() {
  const { id } = useParams();

  // ✅ 统一从 URL 读写参数
  const { query, dateValue, setDates, toQueryString } = useHotelQueryParams({ guests: 2 });
  const { check_in, check_out, guests } = query;

  // ✅ 返回列表：带着当前 query 回 /list
  const backToList = toQueryString() ? `/list?${toQueryString()}` : "/list";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hotel, setHotel] = useState(null);

  // mock 兜底（只在 USE_MOCK 时用）
  const mockHotel = useMemo(() => {
    return mockHotels.find((h) => String(h.id) === String(id)) || null;
  }, [id]);

  useEffect(() => {
    let alive = true;

    async function run() {
      setError("");
      setLoading(true);

      try {
        if (USE_MOCK) {
          if (!mockHotel) throw new Error("未找到该酒店（mock）");
          if (!alive) return;

          setHotel({
            id: mockHotel.id,
            name_zh: mockHotel.name_zh,
            city: mockHotel.city,
            address: mockHotel.address,
            star_rating: mockHotel.star_rating,
            images: mockHotel.images,
            room_types: [
              {
                id: 101,
                name: "标准大床房",
                base_price: mockHotel.min_price,
                discount_rate: 1,
                discounted_price: mockHotel.min_price,
                max_guests: 2,
                total_price: mockHotel.min_price,
              },
              {
                id: 102,
                name: "豪华双床房",
                base_price: mockHotel.min_price + 120,
                discount_rate: 0.9,
                discounted_price: mockHotel.min_price + 80,
                max_guests: 3,
                total_price: mockHotel.min_price + 80,
              },
            ],
            min_price: mockHotel.min_price,
            max_price: mockHotel.min_price + 200,
            estimated_total: mockHotel.min_price,
          });
        } else {
          const params = {
            check_in: check_in || undefined,
            check_out: check_out || undefined,
            guests: guests || "2",
          };

          const res = await fetchHotelDetail(id, params);
          const data = res?.data?.data ?? res?.data;
          if (!data) throw new Error("接口返回为空");
          setHotel(data);
        }
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "加载失败");
        setHotel(null);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, [id, guests, mockHotel]);

  const images = useMemo(() => {
    if (!hotel) return getFallbackImages(id);

    const raw = hotel.images;
    if (Array.isArray(raw) && raw.length) {
      const urls = raw
        .map((x) => (typeof x === "string" ? x : x?.url))
        .filter(Boolean);
      if (urls.length) return urls;
    }

    return getFallbackImages(hotel.id || id);
  }, [hotel, id]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Link to={backToList}>← 返回列表</Link>
        </div>
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Link to={backToList}>← 返回列表</Link>
        </div>
        <Alert type="error" showIcon message="加载酒店详情失败" description={error} />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div style={{ padding: 16 }}>
        <div>未找到该酒店</div>
        <Link to={backToList}>返回列表</Link>
      </div>
    );
  }

  const roomTypes = Array.isArray(hotel.room_types) ? hotel.room_types : [];

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to={backToList}>← 返回列表</Link>
      </div>

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
        {"address" in hotel ? <div>地址：{hotel.address || "—"}</div> : null}
        <div>星级：{hotel.star_rating}</div>

        {/* ✅ 日期选择：写回 URL，触发重新拉取 */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>选择入住 / 离店</div>
          <RangePicker value={dateValue} onChange={setDates} allowClear style={{ width: "100%" }} />
        </div>

        <div style={{ marginTop: 8 }}>
          <div>最低价：{hotel.min_price ?? "—"}</div>
          <div>最高价：{hotel.max_price ?? "—"}</div>
          <div>预估总价：{hotel.estimated_total ?? "—"}</div>
        </div>

        <div style={{ marginTop: 12 }}>
          <Tag>入住：{check_in || "未选择"}</Tag>
          <Tag>离店：{check_out || "未选择"}</Tag>
          <Tag>人数：{guests}</Tag>
        </div>

        <h3 style={{ marginTop: 16 }}>可选房型</h3>
        <List
          dataSource={roomTypes}
          locale={{ emptyText: "暂无可用房型" }}
          renderItem={(r) => (
            <List.Item>
              <div style={{ width: "100%" }}>
                <b>{r.name}</b>（最多 {r.max_guests} 人）
                <div>基础价：{r.base_price}</div>
                <div>折扣：{r.discount_rate}</div>
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
