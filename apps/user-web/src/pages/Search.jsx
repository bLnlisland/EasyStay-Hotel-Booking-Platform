// src/pages/Search.jsx
import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Row, Col, Select, Button, InputNumber, Tag, Input, Card, Divider} from "antd";
import { useNavigate } from "react-router-dom";
import { Carousel } from "antd";
import FacilitiesPicker from "../components/FacilitiesPicker";
import { fetchFacilityOptions } from "../api/facilities";
import { useHotelQuery } from "../hooks/useHotelQuery";
import { useAmapCity } from "../hooks/useAmapCity";
import { getHotelCover } from "../utils/hotelImages";
import MobileDateRange from "../components/MobileDateRange";

const FALLBACK_BANNERS = [
  { id: 1, title: "城市中心 · 高评分酒店", image: "https://images.unsplash.com/photo-1501117716987-c8e1ecb210b0" },
  { id: 2, title: "商务出行首选", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945" },
  { id: 3, title: "度假必住酒店", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa" },
];


export default function Search() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [facilityOptions, setFacilityOptions] = useState([]);

  // ✅ 单一数据源：URL query
  const { query, updateQuery, queryString } = useHotelQuery();

  // ✅ 定位 hook
  const { locateToPatch } = useAmapCity();

  // 设施选项
  useEffect(() => {
    fetchFacilityOptions().then((opts) => {
      const safe = opts || [];
      setFacilityOptions(safe);

      // 可选：把 URL 里非法设施过滤掉（保持稳定）
      const idSet = new Set(safe.map((f) => f.id));
      if (query.facilities?.length) {
        const filtered = query.facilities.filter((x) => idSet.has(x));
        if (filtered.length !== query.facilities.length) updateQuery({ facilities: filtered });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 推荐 banner
  useEffect(() => {
    http
    .get("/hotels/recommended")
    .then((res) => {
      const payload = res?.data ?? res;
      const list = payload?.hotels || payload?.data?.hotels || [];

      const mapped = list.map((h) => ({
        id: h.id,
        title: h.name_zh || h.name_en || "推荐酒店",
        image: getHotelCover(h), // ✅ 没上传就用本地默认图
      }));

      setBanners(mapped);
    })
    .catch((err) => {
      console.error("[recommended] request error:", err);
      setBanners([]);
    });
  }, []);


  // ✅ 价格区间回显
  const priceBucketValue = useMemo(() => {
    const min = query.min_price;
    const max = query.max_price;

    if (min == null && max == null) return undefined;

    // 901+ 约定：min=901, max=null
    if (min === 901 && (max == null || max === undefined)) return "901+";

    if (min === 0 && max === 300) return "0-300";
    if (min === 301 && max === 600) return "301-600";
    if (min === 601 && max === 900) return "601-900";

    // 其他情况（比如用户从别的页面带了非标准区间），不回显档位，避免乱
    return undefined;
  }, [query.min_price, query.max_price]);

    return (
    <div style={{ padding: 12 }}>
      {/* mobile-first 容器：手机像 H5，电脑也不至于太丑 */}
      <div
        style={{
          maxWidth: 430, // ✅ 关键：把宽屏味砍掉
          margin: "0 auto",
        }}
      >
        <h2 style={{ marginBottom: 12, fontSize: 18 }}>酒店查询</h2>

        {/* 1) Banner */}
        <Carousel autoplay style={{ marginBottom: 12 }}>
          {(banners.length ? banners : FALLBACK_BANNERS).map((b) => (
            <div
              key={b.id}
              onClick={() => navigate(`/hotel/${b.id}?${queryString}`)}
              style={{ cursor: "pointer" }}
            >
              <div
                style={{
                  height: 180,
                  borderRadius: 12,
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${b.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 14,
                  color: "#fff",
                  fontSize: 16,
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
        <Card bodyStyle={{ padding: 12 }}>
          {/* 第一组：城市 / 关键词 */}
          <Row gutter={[10, 10]}>
            <Col xs={24} md={12}>
              <Input
                style={{ width: "100%" }}
                placeholder="地点/城市（可输入，定位可自动回填）"
                allowClear
                value={query.city}
                onChange={(e) => updateQuery({ city: e.target.value })}
              />
            </Col>

            <Col xs={24} md={12}>
              <Input
                placeholder="关键字（酒店名/商圈/景点）"
                allowClear
                value={query.keyword}
                onChange={(e) => updateQuery({ keyword: e.target.value })}
              />
            </Col>
          </Row>

          {/* 第二组：日期 */}
          <div style={{ marginTop: 10 }}>
            <MobileDateRange query={query} updateQuery={updateQuery} />
          </div>

          {/* 第三组：人数 + 定位（两列） */}
          <Row gutter={[10, 10]} style={{ marginTop: 10 }}>
            <Col xs={12} md={12}>
              <InputNumber
                min={1}
                max={8}
                style={{ width: "100%" }}
                value={query.guests ?? null}
                onChange={(v) => updateQuery({ guests: v ?? "" })}
                placeholder="入住人数"
              />
            </Col>

            <Col xs={12} md={12}>
              <Button
                block
                onClick={async () => {
                  try {
                    const patch = await locateToPatch(query.city);
                    updateQuery(patch);
                  } catch (e) {
                    console.error(e);
                    alert("定位失败（可能未授权/浏览器不支持）");
                  }
                }}
              >
                定位
              </Button>
            </Col>
          </Row>

          {/* 定位结果 */}
          <div style={{ marginTop: 8 }}>
            {query.lat && query.lng ? (
              <Tag color="blue">
                已定位：{Number(query.lat).toFixed(4)}, {Number(query.lng).toFixed(4)}（城市：
                {query.city || "未填"}）
              </Tag>
            ) : (
              <Tag>未定位</Tag>
            )}
          </div>

          <Divider style={{ margin: "12px 0" }} />

          {/* 星级 / 价格 */}
          <Row gutter={[10, 10]}>
            <Col xs={12} md={12}>
              <Select
                style={{ width: "100%" }}
                placeholder="星级"
                allowClear
                value={query.star_rating ?? undefined}
                onChange={(v) => updateQuery({ star_rating: v ?? null })}
                options={[
                  { value: 1, label: "一星" },
                  { value: 2, label: "二星" },
                  { value: 3, label: "三星" },
                  { value: 4, label: "四星" },
                  { value: 5, label: "五星" },
                ]}
              />
            </Col>

            <Col xs={12} md={12}>
              <Select
                style={{ width: "100%" }}
                placeholder="价格区间"
                allowClear
                value={priceBucketValue}
                onChange={(val) => {
                  if (!val) return updateQuery({ min_price: null, max_price: null });
                  if (val === "0-300") return updateQuery({ min_price: 0, max_price: 300 });
                  if (val === "301-600") return updateQuery({ min_price: 301, max_price: 600 });
                  if (val === "601-900") return updateQuery({ min_price: 601, max_price: 900 });
                  if (val === "901+") return updateQuery({ min_price: 901, max_price: null });
                }}
                options={[
                  { value: "0-300", label: "¥0-300" },
                  { value: "301-600", label: "¥301-600" },
                  { value: "601-900", label: "¥601-900" },
                  { value: "901+", label: "¥901+" },
                ]}
              />
            </Col>
          </Row>

          {/* 设施快捷标签 */}
          <div style={{ marginTop: 10 }}>
            <div style={{ opacity: 0.8, marginBottom: 6 }}>快捷标签（设施）</div>
            <FacilitiesPicker
              options={facilityOptions}
              value={query.facilities}
              onChange={(next) => updateQuery({ facilities: next })}
            />
          </div>

          <Divider style={{ margin: "12px 0" }} />

          {/* 查询按钮 */}
          <Button type="primary" block onClick={() => navigate(`/list?${queryString}`)}>
            查询
          </Button>
        </Card>

        {/* 给底部一点呼吸，不然手机显得挤 */}
        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}