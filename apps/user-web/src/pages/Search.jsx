import { useMemo, useState } from "react";
import {
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  InputNumber,
  Tag,
  Input,
  Space,
  Card,
  Divider,
} from "antd";
import { useNavigate } from "react-router-dom";
import { Carousel } from "antd";

const BANNER_HOTELS = [
  {
    id: 1,
    title: "城市中心 · 高评分酒店",
    image: "https://images.unsplash.com/photo-1501117716987-c8e1ecb210b0",
  },
  {
    id: 2,
    title: "商务出行首选",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
  },
  {
    id: 3,
    title: "度假必住酒店",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
  },
];

const { RangePicker } = DatePicker;

const FACILITY_TAGS = [
  { label: "亲子", code: "family" },
  { label: "豪华", code: "luxury" },
  { label: "免费停车场", code: "parking" },
  { label: "WiFi", code: "wifi" },
  { label: "含早餐", code: "breakfast" },
];

// CRA：高德逆地理编码（lat/lng -> city）
async function reverseGeocodeToCity(lat, lng) {
  const key = process.env.REACT_APP_AMAP_KEY;
  if (!key) {
    throw new Error("缺少高德 Key（REACT_APP_AMAP_KEY）");
  }

  const url = new URL("https://restapi.amap.com/v3/geocode/regeo");
  url.searchParams.set("key", key);
  url.searchParams.set("location", `${lng},${lat}`); // 高德是 lng,lat
  url.searchParams.set("output", "JSON");
  url.searchParams.set("extensions", "base");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("逆地理编码请求失败");
  const data = await res.json();

  const ac = data?.regeocode?.addressComponent;
  const city =
    (Array.isArray(ac?.city) ? "" : ac?.city) ||
    ac?.province ||
    "";

  return city;
}

// 城市标准化工具函数
function normalizeCity(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .replace(/\s+/g, "")
    .replace(/(市|地区|特别行政区)$/, "");
}
export default function Search() {
  const navigate = useNavigate();

  const [query, setQuery] = useState({
    city: "",
    keyword: "", // UI 预留（API 未定义，默认不拼进 qs）
    check_in: null,
    check_out: null,
    guests: 2,

    // ✅ API 支持的筛选
    star_rating: null,
    min_price: null,
    max_price: null,
    facilities: [],

    // 定位展示用
    lat: null,
    lng: null,
  });

  const useGeolocation = () => {
  if (!navigator.geolocation) return alert("当前浏览器不支持定位");

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;

      // 先更新经纬度（给 UI 立即反馈）
      setQuery((q) => ({ ...q, lat: latitude, lng: longitude }));

      // 再用高德逆地理编码解析城市
      try {
      const rawCity = await reverseGeocodeToCity(latitude, longitude);
      const city = normalizeCity(rawCity);
      setQuery((q) => ({ ...q, city: q.city || city }));
      } catch (e) {
        console.error(e);
        alert("已定位，但城市解析失败（可能是 Key / 网络 / 跨域）");
      }
    },
    () => alert("定位失败（可能未授权）")
  );
};


  const toggleFacility = (code) => {
    setQuery((q) => {
      const active = q.facilities.includes(code);
      return {
        ...q,
        facilities: active ? q.facilities.filter((x) => x !== code) : [...q.facilities, code],
      };
    });
  };

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (query.city) p.set("city", normalizeCity(query.city));
    if (query.keyword) p.set("keyword", query.keyword);
    if (query.check_in) p.set("check_in", query.check_in);
    if (query.check_out) p.set("check_out", query.check_out);
    p.set("guests", String(query.guests || 2));

    if (query.star_rating) p.set("star_rating", String(query.star_rating));
    if (query.min_price != null) p.set("min_price", String(query.min_price));
    if (query.max_price != null) p.set("max_price", String(query.max_price));
    if (query.facilities.length) p.set("facilities", query.facilities.join(","));

    return p.toString();
  }, [query]);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 16 }}>酒店查询</h2>

        {/* 1) Banner */}
        <Carousel autoplay style={{ marginBottom: 16 }}>
          {BANNER_HOTELS.map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/hotel/${b.id}?${qs}`)}
              style={{ cursor: "pointer" }}
            >
              <div
                style={{
                  height: 180,
                  borderRadius: 12,
                  backgroundImage: `linear-gradient(
                    rgba(0,0,0,0.35),
                    rgba(0,0,0,0.35)
                  ), url(${b.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 16,
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 600,
                  userSelect: "none",
                }}
              >
                {b.title}
              </div>
            </div>
          ))}
        </Carousel>


        {/* 2) 核心查询区域 */}
        <Card>
          {/* 第一行：地点/关键字/日期/人数/定位按钮 */}
          <Row gutter={[12, 12]} align="middle">
          <Col span={6}>
            <Input
              style={{ width: "100%" }}
              placeholder="地点/城市（可输入，定位可自动回填）"
              allowClear
              value={query.city}
              onChange={(e) => setQuery((q) => ({ ...q, city: e.target.value }))}
            />
          </Col>
            <Col span={6}>
              <Input
                placeholder="关键字（酒店名/商圈/景点）"
                allowClear
                value={query.keyword}
                onChange={(e) => setQuery((q) => ({ ...q, keyword: e.target.value }))}
              />
            </Col>

            <Col span={8}>
              <RangePicker
                style={{ width: "100%" }}
                onChange={(dates) => {
                  if (!dates) {
                    setQuery((q) => ({ ...q, check_in: null, check_out: null }));
                    return;
                  }
                  setQuery((q) => ({
                    ...q,
                    check_in: dates[0].format("YYYY-MM-DD"),
                    check_out: dates[1].format("YYYY-MM-DD"),
                  }));
                }}
              />
            </Col>

            <Col span={2}>
              <InputNumber
                min={1}
                max={8}
                style={{ width: "100%" }}
                value={query.guests}
                onChange={(v) => setQuery((q) => ({ ...q, guests: v || 2 }))}
              />
            </Col>

            <Col span={2}>
              <Button block onClick={useGeolocation}>
                定位
              </Button>
            </Col>
          </Row>

          <Row style={{ marginTop: 8 }}>
            <Col span={24}>
              {query.lat && query.lng ? (
                <Tag color="blue">
                  已定位：{query.lat.toFixed(4)}, {query.lng.toFixed(4)}（城市：{query.city || "未填"}）
                </Tag>
              ) : (
                <Tag>未定位</Tag>
              )}
            </Col>
          </Row>

          <Divider style={{ margin: "12px 0" }} />

          {/* 第二行：筛选条件（星级/价格） */}
          <Row gutter={[12, 12]} align="middle">
            <Col span={6}>
              <Select
                style={{ width: "100%" }}
                placeholder="星级"
                allowClear
                value={query.star_rating ?? undefined}
                onChange={(v) => setQuery((q) => ({ ...q, star_rating: v ?? null }))}
                options={[
                  { value: 3, label: "三星" },
                  { value: 4, label: "四星" },
                  { value: 5, label: "五星" },
                ]}
              />
            </Col>

            <Col span={6}>
              <Select
                style={{ width: "100%" }}
                placeholder="价格区间"
                allowClear
                onChange={(val) => {
                  if (!val) return setQuery((q) => ({ ...q, min_price: null, max_price: null }));
                  if (val === "0-300") setQuery((q) => ({ ...q, min_price: 0, max_price: 300 }));
                  if (val === "300-600") setQuery((q) => ({ ...q, min_price: 300, max_price: 600 }));
                  if (val === "600+") setQuery((q) => ({ ...q, min_price: 600, max_price: null }));
                }}
                options={[
                  { value: "0-300", label: "¥0-300" },
                  { value: "300-600", label: "¥300-600" },
                  { value: "600+", label: "¥600+" },
                ]}
              />
            </Col>

            <Col span={12}>
              <div style={{ opacity: 0.8, marginBottom: 4 }}>快捷标签（设施）</div>
              <Space wrap>
                {FACILITY_TAGS.map((t) => {
                  const active = query.facilities.includes(t.code);
                  return (
                    <Tag
                      key={t.code}
                      color={active ? "blue" : "default"}
                      style={{ cursor: "pointer", userSelect: "none" }}
                      onClick={() => toggleFacility(t.code)}
                    >
                      {t.label}
                    </Tag>
                  );
                })}
              </Space>
            </Col>
          </Row>

          <Divider style={{ margin: "12px 0" }} />

          {/* 3) 查询按钮 */}
          <Row>
            <Col span={24}>
              <Button type="primary" block onClick={() => navigate(`/list?${qs}`)}>
                查询
              </Button>
            </Col>
          </Row>

          {/* keyword 说明（可删） */}
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 10 }}>
            注：关键字搜索当前为 UI 预留（接口文档未定义 keyword 参数），后续可与后端对齐再接入。
          </div>
        </Card>
      </div>
    </div>
  );
}
