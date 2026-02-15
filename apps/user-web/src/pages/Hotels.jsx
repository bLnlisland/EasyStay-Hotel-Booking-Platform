import { useEffect, useMemo, useState, useRef } from "react";
import { List, Card, Select, DatePicker, Button, InputNumber, Row, Col, Tag, Drawer, Input, Space } from "antd";
import { mockHotels } from "../mock/hotels";
import { http } from "../api/http"; // 后端可用时再打开
import { Link, useSearchParams } from "react-router-dom";
import FacilitiesPicker from "../components/FacilitiesPicker";
import { fetchFacilityOptions } from "../api/facilities";
import { parseFacilities, stringifyFacilities } from "../utils/facilities";

const { RangePicker } = DatePicker;
const USE_MOCK = false; // 本地测试用 mock；后端通了改 false



function normalizeCity(input) {
  if (!input) return "";
  return String(input)
    .trim()
    .replace(/\s+/g, "")
    .replace(/(市|地区|特别行政区)$/, "");
}

export default function Hotels() {
  // ✅ 统一的“查询条件”（未来直接作为接口 params）
  const [query, setQuery] = useState({
    city: "",
    keyword: "",
    check_in: null,
    check_out: null,
    guests: 2,

    star_rating: null,
    min_price: null,
    max_price: null,
    facilities: [],
    sort: "", // "price_asc" | "price_desc" | "star_desc" | ""

    lat: null,
    lng: null,
    radiusKm: null,
  });

    // ✅ 从 URL 读取查询条件（/list?city=...&check_in=...&check_out=...&guests=...）
  const [sp, setSp] = useSearchParams();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);
  const [facilityOptions, setFacilityOptions] = useState([]);

  useEffect(() => {
    fetchFacilityOptions().then((opts = []) => setFacilityOptions(opts));
  }, []);


useEffect(() => {
  setQuery((q) => ({
    ...q,
    city: normalizeCity(sp.get("city") || ""),
    keyword: sp.get("keyword") || "",
    check_in: sp.get("check_in") || null,
    check_out: sp.get("check_out") || null,
    guests: Number(sp.get("guests") || 2),

    star_rating: sp.get("star_rating") ? Number(sp.get("star_rating")) : null,
    min_price: sp.get("min_price") ? Number(sp.get("min_price")) : null,
    max_price: sp.get("max_price") ? Number(sp.get("max_price")) : null,

    facilities: parseFacilities(sp.get("facilities")),
    sort: sp.get("sort") || "",
  }));
  setPage(1);
  setHotels([]);
  setHasMore(true);

}, [sp]);



  // 原始数据源（mock 或接口）
  const [hotels, setHotels] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

useEffect(() => {
  if (USE_MOCK) {
    setHotels(mockHotels);
    setHasMore(false);
    return;
  }

  const myReqId = ++reqIdRef.current;
  let cancelled = false;

  setLoading(true);

  const params = {
    page,
    limit: 10,
    city: normalizeCity(query.city) || undefined,
    keyword: query.keyword?.trim() || undefined,
    check_in: query.check_in || undefined,
    check_out: query.check_out || undefined,
    guests: query.guests || 2,
    star_rating: query.star_rating ?? undefined,
    min_price: query.min_price ?? undefined,
    max_price: query.max_price ?? undefined,
    facilities: query.facilities?.length ? query.facilities.join(",") : undefined,
  };

  console.log("REQ =>", params);

  http
    .get("/hotels/public", { params })
    .then((res) => {
      if (cancelled) return;
      if (myReqId !== reqIdRef.current) return;

      if (!res?.success) {
        setHotels([]);
        setHasMore(false);
        return;
      }

      const data = res.data;
      console.log("RES first city =>", data?.hotels?.[0]?.city);

      setHotels((prev) => (page === 1 ? data.hotels : [...prev, ...data.hotels]));
      setHasMore(!!data.pagination?.has_more);
    })
    .catch(() => {
      if (cancelled) return;
      if (myReqId !== reqIdRef.current) return;

      setHotels([]);
      setHasMore(false);
    })
    .finally(() => {
      if (cancelled) return;
      if (myReqId !== reqIdRef.current) return;
      setLoading(false);
    });

  return () => {
    cancelled = true;
  };
}, [USE_MOCK, page, query.city, query.check_in, query.check_out, query.guests, query.star_rating, query.min_price, query.max_price, query.facilities]);



const applyToUrl = (nextQuery) => {
  const p = new URLSearchParams();

  const city = normalizeCity(nextQuery.city);
  if (city) p.set("city", city);

  if (nextQuery.keyword) p.set("keyword", nextQuery.keyword);
  if (nextQuery.check_in) p.set("check_in", nextQuery.check_in);
  if (nextQuery.check_out) p.set("check_out", nextQuery.check_out);
  p.set("guests", String(nextQuery.guests || 2));

  if (nextQuery.star_rating) p.set("star_rating", String(nextQuery.star_rating));
  if (nextQuery.min_price != null) p.set("min_price", String(nextQuery.min_price));
  if (nextQuery.max_price != null) p.set("max_price", String(nextQuery.max_price));
  if (nextQuery.facilities?.length) p.set("facilities", nextQuery.facilities.join(","));
  if (nextQuery.sort) p.set("sort", nextQuery.sort);

  setSp(p, { replace: true });
};

const qs = useMemo(() => {
  const p = new URLSearchParams();
  const city = normalizeCity(query.city);
  if (city) p.set("city", city);
  if (query.keyword) p.set("keyword", query.keyword);
  if (query.check_in) p.set("check_in", query.check_in);
  if (query.check_out) p.set("check_out", query.check_out);
  p.set("guests", String(query.guests || 2));

  if (query.star_rating) p.set("star_rating", String(query.star_rating));
  if (query.min_price != null) p.set("min_price", String(query.min_price));
  if (query.max_price != null) p.set("max_price", String(query.max_price));
  if (query.facilities?.length) p.set("facilities", query.facilities.join(","));
  if (query.sort) p.set("sort", query.sort);

  return p.toString();
}, [query]);

  // ✅ 视图层过滤（mock 阶段使用；接真接口后可删）
  const viewHotels = useMemo(() => {
    let list = hotels;

    if (query.city) {
      const c = normalizeCity(query.city);
      list = list.filter((h) => normalizeCity(h.city) === c);
    }


    // 日期过滤（最小可用：只要在可订范围内）
    if (query.check_in && query.check_out) {
      list = list.filter((h) => {
        if (!h.available) return true;
        return (
          query.check_in >= h.available.from &&
          query.check_out <= h.available.to
        );
      });
    }

    // 定位过滤（占位：未来接距离算法）
    // if (query.lat && query.lng && query.radiusKm) { ... }
    // 关键字（mock：匹配酒店名/地址/城市）
    if (query.keyword) {
      const kw = query.keyword.trim().toLowerCase();
      list = list.filter((h) => {
        const text = `${h.name_zh || ""} ${h.address || ""} ${h.city || ""}`.toLowerCase();
        return text.includes(kw);
      });
    }

    // 星级
    if (query.star_rating) {
      list = list.filter((h) => Number(h.star_rating || 0) === Number(query.star_rating));
    }

    // 价格区间（用 min_price）
    if (query.min_price != null) {
      list = list.filter((h) => Number(h.min_price || 0) >= Number(query.min_price));
    }
    if (query.max_price != null) {
      list = list.filter((h) => Number(h.min_price || 0) <= Number(query.max_price));
    }

    // 设施（如果 mock 没有 facilities 字段，就先不拦；有的话再过滤）
    if (query.facilities?.length) {
      list = list.filter((h) => {
        if (!Array.isArray(h.facilities)) return true; // mock 阶段容错
        return query.facilities.every((f) => h.facilities.includes(f));
      });
    }

    // 排序
    if (query.sort === "price_asc") {
      list = [...list].sort((a, b) => Number(a.min_price || 0) - Number(b.min_price || 0));
    }
    if (query.sort === "price_desc") {
      list = [...list].sort((a, b) => Number(b.min_price || 0) - Number(a.min_price || 0));
    }
    if (query.sort === "star_desc") {
      list = [...list].sort((a, b) => Number(b.star_rating || 0) - Number(a.star_rating || 0));
    }

    return list;
  }, [hotels, query]);

  // 浏览器定位（lat/lng）
  const useGeolocation = () => {
    if (!navigator.geolocation) {
      alert("当前浏览器不支持定位");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setQuery((q) => ({
          ...q,
          lat: latitude,
          lng: longitude,
          radiusKm: 5, // 先给默认半径
        }));
      },
      () => alert("定位失败（可能未授权）")
    );
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>酒店列表</h2>

      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        {query.city && <Tag>城市：{query.city}</Tag>}
        {query.check_in && query.check_out && (
          <Tag>
            日期：{query.check_in} ～ {query.check_out}
          </Tag>
        )}
        {query.star_rating && <Tag>星级： {query.star_rating}</Tag>}
        {(query.min_price != null || query.max_price != null) && (
          <Tag>
            价格：
            {query.min_price ?? 0}
            ～
            {query.max_price ?? "∞"}
          </Tag>
        )}
        {query.facilities?.map((f) => (
          <Tag key={f}>{f}</Tag>
        ))}
      </Row>

      {/* ===== 查询条件区 ===== */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
        <Col>
        <Input
          style={{ width: 160 }}
          placeholder="地点/城市（可输入）"
          allowClear
          value={query.city}
          onChange={(e) =>
            setQuery((q) => ({ ...q, city: e.target.value }))
          }
        />
        </Col>

        <Col>
          <RangePicker
            onChange={(dates) => {
              if (!dates) {
                setQuery((q) => ({ ...q, check_in: null, check_out: null }));
                return;
              }
              // antd v4：moment
              setQuery((q) => ({
                ...q,
                check_in: dates[0].format("YYYY-MM-DD"),
                check_out: dates[1].format("YYYY-MM-DD"),
              }));
            }}
          />
        </Col>

        <Col>
          <InputNumber
            min={1}
            max={8}
            value={query.guests}
            onChange={(v) => setQuery((q) => ({ ...q, guests: v || 2 }))}
            addonBefore="人数"
          />
        </Col>

        <Col>
          <Button onClick={useGeolocation}>使用定位</Button>
        </Col>

        <Col>
          {(query.lat && query.lng) && (
            <Tag color="blue">
              已定位：{query.lat.toFixed(4)}, {query.lng.toFixed(4)}
            </Tag>
          )}
        </Col>
      </Row>
      <Col>
        <Button onClick={() => setFilterOpen(true)}>详细筛选</Button>
      </Col>

      <Drawer
        title="详细筛选"
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        placement="right"
        width={360}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            <div style={{ marginBottom: 6, opacity: 0.8 }}>关键字</div>
            <Input
              placeholder="酒店名/地址/城市"
              value={query.keyword}
              onChange={(e) => setQuery((q) => ({ ...q, keyword: e.target.value }))}
              allowClear
            />
          </div>

          <div>
            <div style={{ marginBottom: 6, opacity: 0.8 }}>星级</div>
            <Select
              style={{ width: "100%" }}
              allowClear
              placeholder="星级"
              value={query.star_rating ?? undefined}
              onChange={(v) => setQuery((q) => ({ ...q, star_rating: v ?? null }))}
              options={[
                { value: 3, label: "三星" },
                { value: 4, label: "四星" },
                { value: 5, label: "五星" },
              ]}
            />
          </div>

          <div>
            <div style={{ marginBottom: 6, opacity: 0.8 }}>价格区间（元）</div>
            <Row gutter={8}>
              <Col span={12}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="最低价"
                  min={0}
                  value={query.min_price}
                  onChange={(v) => setQuery((q) => ({ ...q, min_price: v ?? null }))}
                />
              </Col>
              <Col span={12}>
                <InputNumber
                  style={{ width: "100%" }}
                  placeholder="最高价"
                  min={0}
                  value={query.max_price}
                  onChange={(v) => setQuery((q) => ({ ...q, max_price: v ?? null }))}
                />
              </Col>
            </Row>
          </div>

          <div>
            <div style={{ marginBottom: 6, opacity: 0.8 }}>设施</div>
            <FacilitiesPicker
              options={facilityOptions}
              value={query.facilities}
              onChange={(next) => setQuery((q) => ({ ...q, facilities: next }))}
            />
            <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
              注：若 mock 数据无 facilities 字段，筛选不会减少列表，但 URL 参数会保留（联调后生效）
            </div>
          </div>

          <div>
            <div style={{ marginBottom: 6, opacity: 0.8 }}>排序</div>
            <Select
              style={{ width: "100%" }}
              allowClear
              placeholder="默认排序"
              value={query.sort || undefined}
              onChange={(v) => setQuery((q) => ({ ...q, sort: v || "" }))}
              options={[
                { value: "price_asc", label: "价格从低到高" },
                { value: "price_desc", label: "价格从高到低" },
                { value: "star_desc", label: "星级从高到低" },
              ]}
            />
          </div>

          <Row gutter={8}>
            <Col span={12}>
              <Button
                block
                onClick={() => {
                  const reset = {
                    ...query,
                    keyword: "",
                    star_rating: null,
                    min_price: null,
                    max_price: null,
                    facilities: [],
                    sort: "",
                  };
                  setQuery(reset);
                  applyToUrl(reset);
                }}
              >
                重置
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                block
                onClick={() => {
                  applyToUrl(query);
                  setFilterOpen(false);
                }}
              >
                应用筛选
              </Button>
            </Col>
          </Row>
        </Space>
      </Drawer>

      {/* ===== 列表区 ===== */}
      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={USE_MOCK ? viewHotels : hotels}
        renderItem={(h) => (
          <List.Item>
            <Card
              title={h.name_zh}
              extra={
                <Link
                  to={`/hotel/${h.id}?${qs}`}
                >
                  查看详情
                </Link>
              }
            >
              <div>城市：{h.city}</div>
              <div>地址：{h.address}</div>
              <div>星级：{h.star_rating}</div>
              <div>起价：{h.min_price}</div>
              {/* {h.available && (
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  可订：{h.available.from} ～ {h.available.to}
                </div>
              )} */}
            </Card>
          </List.Item>
        )}
      />
      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Button
          disabled={!hasMore}
          loading={loading}
          onClick={() => setPage((p) => p + 1)}
        >
          {hasMore ? "加载更多" : "没有更多了"}
        </Button>
      </div>   
    </div>
  );
}

/**
 * 可选工具：把 null/undefined 的查询条件剔除（接真接口时用）
 */
function compactQuery(q) {
  const out = {};
  Object.keys(q).forEach((k) => {
    if (q[k] !== null && q[k] !== "" && q[k] !== undefined) out[k] = q[k];
  });
  return out;
}

