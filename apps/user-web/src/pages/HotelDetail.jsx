import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { mockHotels } from "../mock/hotels";
import { fetchHotelDetail } from "../api/hotels";
import { Card, List, Tag, Carousel, Spin, Alert, DatePicker } from "antd";
import { useHotelQueryParams } from "../hooks/useHotelQueryParams";
import { FACILITY_NAME_BY_ID } from "../constants/facilities";
import { getHotelCarouselImages } from "../utils/hotelImages";

const { RangePicker } = DatePicker;

// 小提示：Vite 通常要 VITE_ 前缀（但答辩前别乱改 env，按你项目实际为准）
const USE_MOCK = import.meta.env.APP_USE_MOCK === "true";

export default function HotelDetail() {
  const { id } = useParams();

  // 统一从 URL 读写参数
  const { query, dateValue, setDates, toQueryString } = useHotelQueryParams();
  const { check_in, check_out, guests } = query;

  // 返回列表：带着当前 query 回 /list
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
            facilities: mockHotel.facilities || [], // ✅ mock 也带设施更像真数据
            room_types: [
              {
                id: 101,
                name: "标准大床房",
                base_price: mockHotel.min_price,
                area: 25,
                max_guests: 2,
                total_price: mockHotel.min_price,
              },
              {
                id: 102,
                name: "豪华双床房",
                base_price: mockHotel.min_price + 80,
                area: 35,
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
            guests: guests || undefined,
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
  }, [id, guests, check_in, check_out, mockHotel]); // ✅ 补齐依赖，日期变更会刷新

  const images = useMemo(() => {
    return getHotelCarouselImages(hotel, { count: 3 });
  }, [hotel]);

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
    <div style={{ padding: 12 }}>
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        {/* 返回：做成更好点的点击区域 */}
        <div style={{ marginBottom: 10 }}>
          <Link
            to={backToList}
            style={{
              display: "inline-block",
              padding: "6px 10px",
              borderRadius: 10,
              background: "#fff",
            }}
          >
            ← 返回列表
          </Link>
        </div>

        {/* Banner */}
        <div style={{ marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
          <Carousel autoplay dots>
            {images.map((url, idx) => (
              <div key={`${url}-${idx}`}>
                <div
                  style={{
                    height: 200,
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
                      right: 12,
                      color: "#fff",
                      fontWeight: 600,
                      textShadow: "0 1px 6px rgba(0,0,0,0.35)",
                      lineHeight: 1.2,
                    }}
                  >
                    {hotel.name_zh}
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

        {/* 基础信息卡 */}
        <Card title={hotel.name_zh} bodyStyle={{ padding: 12 }}>
          <div style={{ opacity: 0.85 }}>城市：{hotel.city}</div>
          {"address" in hotel ? <div style={{ opacity: 0.85 }}>地址：{hotel.address || "—"}</div> : null}
          <div style={{ opacity: 0.85 }}>星级：{hotel.star_rating}</div>

          {/* 设施 */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>酒店设施</div>

            {Array.isArray(hotel.facilities) && hotel.facilities.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {hotel.facilities.map((id) => (
                  <Tag key={id}>{FACILITY_NAME_BY_ID[id] || id}</Tag>
                ))}
              </div>
            ) : (
              <span style={{ opacity: 0.6 }}>—</span>
            )}
          </div>

          {/* 日期选择 */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>选择入住 / 离店</div>
            <RangePicker value={dateValue} onChange={setDates} allowClear style={{ width: "100%" }} />
          </div>

          {/* 价格信息：做成更“汇总块” */}
          <div
            style={{
              marginTop: 12,
              padding: 10,
              borderRadius: 12,
              background: "#fafafa",
            }}
          >
            <div>最低价：{hotel.min_price ?? "—"}</div>
            <div>最高价：{hotel.max_price ?? "—"}</div>
            {/* <div style={{ fontWeight: 600, marginTop: 4 }}>预估总价：{hotel.estimated_total ?? "—"}</div> */}
          </div>

          <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Tag>入住：{check_in || "未选择"}</Tag>
            <Tag>离店：{check_out || "未选择"}</Tag>
            <Tag>人数：{guests}</Tag>
          </div>

          {/* 房型 */}
          <h3 style={{ marginTop: 16, marginBottom: 8 }}>可选房型</h3>
          <List
            dataSource={roomTypes}
            locale={{ emptyText: "暂无可用房型" }}
            renderItem={(r) => (
              <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                {/* 房型卡片化：更像移动端 */}
                <div
                  style={{
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #f0f0f0",
                    background: "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>
                        {r.name} <span style={{ fontWeight: 400, opacity: 0.75 }}>（最多 {r.max_guests} 人）</span>
                      </div>
                      {r.area != null && <div style={{ opacity: 0.8, marginTop: 4 }}>面积：{r.area} ㎡</div>}
                      {r.total_price != null && <div style={{ opacity: 0.8, marginTop: 4 }}>总价：¥{r.total_price}</div>}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>¥{r.base_price}</div>
                      <div style={{ opacity: 0.7, fontSize: 12 }}>/晚</div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}