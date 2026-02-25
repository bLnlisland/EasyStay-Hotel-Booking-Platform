import { useEffect, useMemo, useRef, useState } from "react";
import { List, Card, Select, DatePicker, Button, InputNumber, Row, Col, Tag, Drawer, Input, Space,Grid } from "antd";
import { Link,useNavigate } from "react-router-dom";
import { http } from "../api/http";
import FacilitiesPicker from "../components/FacilitiesPicker";
import { fetchFacilityOptions } from "../api/facilities";
import { stringifyFacilities } from "../utils/facilities";

import { useHotelQuery } from "../hooks/useHotelQuery";
import { useAmapCity } from "../hooks/useAmapCity";
import MobileDateRange from "../components/MobileDateRange";
import { ArrowLeftOutlined } from "@ant-design/icons";
const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

// 如果你还有 mock 需求可以保留，否则建议直接删掉 mock 分支
const USE_MOCK = false;
const PAGE_SIZE = 10;

function getHotelMinPrice(h) {
  // 兜底逻辑：优先用后端给的 min_price
  const p = Number(h?.min_price);
  if (Number.isFinite(p)) return p;

  // 如果后端给了 room_types（你之前 JSON 里有），就取最小 base_price
  const rts = Array.isArray(h?.room_types) ? h.room_types : [];
  const prices = rts.map((r) => Number(r?.base_price)).filter((x) => Number.isFinite(x));
  if (prices.length) return Math.min(...prices);

  return null; // 没价格
}

function sortHotels(list, sort) {
  if (!sort) return list;

  const arr = [...list];

  if (sort === "price_asc") {
    arr.sort((a, b) => {
      const pa = getHotelMinPrice(a);
      const pb = getHotelMinPrice(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1; // 没价格放后面
      if (pb == null) return -1;
      return pa - pb;
    });
    return arr;
  }

  if (sort === "price_desc") {
    arr.sort((a, b) => {
      const pa = getHotelMinPrice(a);
      const pb = getHotelMinPrice(b);
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return pb - pa;
    });
    return arr;
  }

  if (sort === "star_desc") {
    arr.sort((a, b) => Number(b?.star_rating || 0) - Number(a?.star_rating || 0));
    return arr;
  }

  return arr;
}

export default function Hotels() {
  const { query, updateQuery, queryString } = useHotelQuery();
  const { locateToPatch } = useAmapCity();

  // 列表状态
  const [hotels, setHotels] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  // 分页/加载更多
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const reqIdRef = useRef(0);
  const sentinelRef = useRef(null);  

  // 设施选项
  const [facilityOptions, setFacilityOptions] = useState([]);
  useEffect(() => {
    fetchFacilityOptions().then((opts = []) => setFacilityOptions(opts));
  }, []);

  // 当 queryString 变化（筛选变化）时：重置分页并重新拉第一页
  useEffect(() => {
    setPage(1);
    setHotels([]);
    setHasMore(true);
  }, [queryString]);

  // 拉取数据
  useEffect(() => {
    if (USE_MOCK) return;

    const myReqId = ++reqIdRef.current;
    let cancelled = false;
    setLoading(true);

    const params = {
      page,
      limit: PAGE_SIZE + 1, // 多请求一条用来判断 hasMore
      city: query.city || undefined,
      keyword: query.keyword?.trim() || undefined,
      check_in: query.check_in || undefined,
      check_out: query.check_out || undefined,
      guests: query.guests || undefined,
      star_rating: query.star_rating ?? undefined,
      min_price: query.min_price ?? undefined,
      max_price: query.max_price ?? undefined,
      facilities: stringifyFacilities(query.facilities),
      // ✅ 先把 sort 传给后端（后端支持就直接生效）
      sort: query.sort || undefined,
    };

    http
      .get("/hotels/public", { params })
      .then((res) => {
        if (cancelled) return;
        if (myReqId !== reqIdRef.current) return;

        const payload = res?.data ?? res;
        const ok = payload?.success ?? true;
        const data = payload?.data ?? payload;

        if (!ok) {
          setHotels([]);
          setHasMore(false);
          return;
        }

        const listRaw = Array.isArray(data?.hotels) ? data.hotels : [];

        const nextHasMore = listRaw.length > PAGE_SIZE;
        const list = listRaw.slice(0, PAGE_SIZE);

        setHotels((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasMore(nextHasMore);
      })
      .catch((err) => {
        console.error(err);
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
  }, [
    page,
    query.city,
    query.keyword,
    query.check_in,
    query.check_out,
    query.guests,
    query.star_rating,
    query.min_price,
    query.max_price,
    query.facilities,
    query.sort,
  ]);
  console.log("query.facilities:", query.facilities);
  console.log("当前 page:", page, "当前 hotels 数量:", hotels.length);
  // 👇👇👇 新增：上滑自动加载
useEffect(() => {
  if (!hasMore || loading) return;

  const el = sentinelRef.current;
  if (!el) return;

  const io = new IntersectionObserver(
    (entries) => {
      const first = entries[0];
      if (!first.isIntersecting) return;

      setPage((p) => p + 1);
    },
    {
      root: null,
      rootMargin: "150px", // 提前加载
      threshold: 0,
    }
  );

  io.observe(el);
  return () => io.disconnect();
}, [hasMore, loading]);

  // ✅ 展示列表：不管后端是否支持排序，都做前端兜底排序
  const viewHotels = useMemo(() => {
    return sortHotels(hotels, query.sort);
  }, [hotels, query.sort]);

  //返回搜索页
  const navigate = useNavigate();

  return (
    <div style={{ padding: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          cursor: "pointer",
          fontSize: 16,
          fontWeight: 500,
        }}
        onClick={() => navigate(`/search?${queryString}`)}
      >
        <ArrowLeftOutlined style={{ marginRight: 8 }} />
        返回
      </div>
      {/* 移动端容器：像H5 */}
      <div style={{ maxWidth: 430, margin: "0 auto" }}>
        <h2 style={{ marginBottom: 8, fontSize: 18 }}>酒店列表</h2>

        {/* 顶部标签：移动端建议横向可滚动 */}
        <div style={{ overflowX: "auto", whiteSpace: "nowrap", marginBottom: 10 }}>
          {query.city && <Tag style={{ display: "inline-block" }}>城市：{query.city}</Tag>}
          {query.check_in && query.check_out && (
            <Tag style={{ display: "inline-block" }}>
              日期：{query.check_in} ～ {query.check_out}
            </Tag>
          )}
          {query.star_rating && <Tag style={{ display: "inline-block" }}>星级：{query.star_rating}</Tag>}
          {(query.min_price != null || query.max_price != null) && (
            <Tag style={{ display: "inline-block" }}>
              价格：{query.min_price ?? 0} ～ {query.max_price ?? "∞"}
            </Tag>
          )}
          {query.facilities?.map((f) => (
            <Tag key={f} style={{ display: "inline-block" }}>
              {f}
            </Tag>
          ))}
          {query.sort && (
            <Tag color="purple" style={{ display: "inline-block" }}>
              排序：{query.sort}
            </Tag>
          )}
        </div>

        {/* 顶部操作区：移动端就保留三个东西：城市输入 + 定位 + 筛选 */}
        <Row gutter={[10, 10]} align="middle" style={{ marginBottom: 10 }}>
          <Col xs={24} md={12}>
            <Input
              placeholder="地点/城市（可输入）"
              allowClear
              value={query.city}
              onChange={(e) => updateQuery({ city: e.target.value })}
            />
          </Col>

          <Col xs={12} md={6}>
            <Button
              block
              onClick={async () => {
                try {
                  const patch = await locateToPatch(query.city);
                  updateQuery({ ...patch, radiusKm: undefined });
                } catch (e) {
                  console.error(e);
                  alert("定位失败（可能未授权/浏览器不支持）");
                }
              }}
            >
              定位
            </Button>
          </Col>

          <Col xs={12} md={6}>
            <Button block type="primary" onClick={() => setFilterOpen(true)}>
              筛选
            </Button>
          </Col>

          {/* 定位提示（可选） */}
          {query.lat && query.lng && (
            <Col xs={24}>
              <Tag color="blue">
                已定位：{Number(query.lat).toFixed(4)}, {Number(query.lng).toFixed(4)}
              </Tag>
            </Col>
          )}
        </Row>

        {/* 详细筛选 Drawer：移动端建议 bottom，更像App */}
        <Drawer
          title="筛选"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          placement="bottom"
          height="78vh"
        >
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <div>
              <div style={{ marginBottom: 6, opacity: 0.8 }}>关键字</div>
              <Input
                placeholder="酒店名/地址/城市"
                value={query.keyword}
                onChange={(e) => updateQuery({ keyword: e.target.value })}
                allowClear
              />
            </div>

            <div>
              <div style={{ marginBottom: 6, opacity: 0.8 }}>日期</div>
              <MobileDateRange query={query} updateQuery={updateQuery} />
            </div>

            <div>
              <div style={{ marginBottom: 6, opacity: 0.8 }}>人数</div>
              <InputNumber
                min={1}
                max={8}
                style={{ width: "100%" }}
                value={query.guests ?? null}
                onChange={(v) => updateQuery({ guests: v ?? "" })}
                placeholder="入住人数"
              />
            </div>

            <div>
              <div style={{ marginBottom: 6, opacity: 0.8 }}>星级</div>
              <Select
                style={{ width: "100%" }}
                allowClear
                placeholder="星级"
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
                    onChange={(v) => updateQuery({ min_price: v ?? null })}
                  />
                </Col>
                <Col span={12}>
                  <InputNumber
                    style={{ width: "100%" }}
                    placeholder="最高价"
                    min={0}
                    value={query.max_price}
                    onChange={(v) => updateQuery({ max_price: v ?? null })}
                  />
                </Col>
              </Row>
            </div>

            <div>
              <div style={{ marginBottom: 6, opacity: 0.8 }}>设施</div>
              <FacilitiesPicker
                options={facilityOptions}
                value={query.facilities}
                onChange={(next) => updateQuery({ facilities: next })}
              />
            </div>

            <div>
              <div style={{ marginBottom: 6, opacity: 0.8 }}>排序</div>
              <Select
                style={{ width: "100%" }}
                allowClear
                placeholder="默认排序"
                value={query.sort || undefined}
                onChange={(v) => updateQuery({ sort: v || null })}
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
                    updateQuery({
                      keyword: "",
                      star_rating: null,
                      min_price: null,
                      max_price: null,
                      facilities: [],
                      sort: null,
                    });
                  }}
                >
                  重置
                </Button>
              </Col>
              <Col span={12}>
                <Button type="primary" block onClick={() => setFilterOpen(false)}>
                  完成
                </Button>
              </Col>
            </Row>
          </Space>
        </Drawer>

        {/* 列表区：手机必须单列 */}
        <List
          grid={{ gutter: 12, column: 1 }}
          dataSource={USE_MOCK ? [] : viewHotels}
          renderItem={(h) => (
            <List.Item>
              <Card
                title={h.name_zh}
                extra={<Link to={`/hotel/${h.id}?${queryString}`}>详情</Link>}
                bodyStyle={{ padding: 12 }}
              >
                <div style={{ opacity: 0.85 }}>城市：{h.city}</div>
                <div style={{ opacity: 0.85 }}>地址：{h.address}</div>
                <div style={{ opacity: 0.85 }}>星级：{h.star_rating}</div>
                <div style={{ marginTop: 6, fontWeight: 600 }}>起价：{getHotelMinPrice(h) ?? "-"}</div>
              </Card>
            </List.Item>
          )}
        />

        <div style={{ textAlign: "center", marginTop: 12, opacity: 0.7 }}>
          {loading ? "加载中..." : hasMore ? "上滑加载更多" : "没有更多了"}
        </div>

        {/* 👇 触底哨兵：进入视口就会自动加载 */}
        <div ref={sentinelRef} style={{ height: 1 }} />

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}