import { useEffect, useMemo, useRef, useState } from "react";
import { List, Card, Select, DatePicker, Button, InputNumber, Row, Col, Tag, Drawer, Input, Space } from "antd";
import { Link } from "react-router-dom";
import { http } from "../api/http";
import FacilitiesPicker from "../components/FacilitiesPicker";
import { fetchFacilityOptions } from "../api/facilities";
import { stringifyFacilities } from "../utils/facilities";

import { useHotelQuery } from "../hooks/useHotelQuery";
import { useAmapCity } from "../hooks/useAmapCity";

const { RangePicker } = DatePicker;

// 如果你还有 mock 需求可以保留，否则建议直接删掉 mock 分支
const USE_MOCK = false;

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
      limit: 10,
      city: query.city || undefined,
      keyword: query.keyword?.trim() || undefined,
      check_in: query.check_in || undefined,
      check_out: query.check_out || undefined,
      guests: query.guests || 2,
      star_rating: query.star_rating ?? undefined,
      min_price: query.min_price ?? undefined,
      max_price: query.max_price ?? undefined,
      facilities: query.facilities?.length ? query.facilities.join(",") : undefined,
      // ✅ 先把 sort 传给后端（后端支持就直接生效）
      sort: query.sort || undefined,
    };

    http
      .get("/hotels/public", { params })
      .then((res) => {
        if (cancelled) return;
        if (myReqId !== reqIdRef.current) return;

        const payload = res?.data ?? res;

        // 兼容：payload.success / payload.data
        const ok = payload?.success ?? true;
        const data = payload?.data ?? payload;

        if (!ok) {
          setHotels([]);
          setHasMore(false);
          return;
        }

        const list = Array.isArray(data?.hotels) ? data.hotels : [];
        const has_more = !!data?.pagination?.has_more;

        setHotels((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasMore(has_more);
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
  // ✅ 展示列表：不管后端是否支持排序，都做前端兜底排序
  const viewHotels = useMemo(() => {
    return sortHotels(hotels, query.sort);
  }, [hotels, query.sort]);

  return (
    <div style={{ padding: 16 }}>
      <h2>酒店列表</h2>

      {/* 顶部标签 */}
      <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
        {query.city && <Tag>城市：{query.city}</Tag>}
        {query.check_in && query.check_out && <Tag>日期：{query.check_in} ～ {query.check_out}</Tag>}
        {query.star_rating && <Tag>星级：{query.star_rating}</Tag>}
        {(query.min_price != null || query.max_price != null) && (
          <Tag>
            价格：{query.min_price ?? 0} ～ {query.max_price ?? "∞"}
          </Tag>
        )}
        {query.facilities?.map((f) => (
          <Tag key={f}>{f}</Tag>
        ))}
        {query.sort && <Tag color="purple">排序：{query.sort}</Tag>}
      </Row>

      {/* ===== 查询条件区（即时生效：改了就写 URL） ===== */}
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Input
            style={{ width: 160 }}
            placeholder="地点/城市（可输入）"
            allowClear
            value={query.city}
            onChange={(e) => updateQuery({ city: e.target.value })}
          />
        </Col>

        <Col>
          <RangePicker
            onChange={(dates) => {
              if (!dates) return updateQuery({ check_in: null, check_out: null });
              updateQuery({
                check_in: dates[0].format("YYYY-MM-DD"),
                check_out: dates[1].format("YYYY-MM-DD"),
              });
            }}
          />
        </Col>

        <Col>
          <InputNumber
            min={1}
            max={8}
            value={query.guests}
            onChange={(v) => updateQuery({ guests: v || 2 })}
            addonBefore="人数"
          />
        </Col>

        <Col>
          <Button
            onClick={async () => {
              try {
                const patch = await locateToPatch(query.city);
                updateQuery({ ...patch, radiusKm: undefined }); // radiusKm 你目前没纳入统一 query，可先不带
              } catch (e) {
                console.error(e);
                alert("定位失败（可能未授权/浏览器不支持）");
              }
            }}
          >
            使用定位
          </Button>
        </Col>

        <Col>{query.lat && query.lng && <Tag color="blue">已定位：{Number(query.lat).toFixed(4)}, {Number(query.lng).toFixed(4)}</Tag>}</Col>

        <Col>
          <Button onClick={() => setFilterOpen(true)}>详细筛选</Button>
        </Col>
      </Row>

      {/* ===== 详细筛选 Drawer ===== */}
      <Drawer title="详细筛选" open={filterOpen} onClose={() => setFilterOpen(false)} placement="right" width={360}>
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
            <div style={{ marginBottom: 6, opacity: 0.8 }}>星级</div>
            <Select
              style={{ width: "100%" }}
              allowClear
              placeholder="星级"
              value={query.star_rating ?? undefined}
              onChange={(v) => updateQuery({ star_rating: v ?? null })}
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
            <FacilitiesPicker options={facilityOptions} value={query.facilities} onChange={(next) => updateQuery({ facilities: next })} />
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

      {/* ===== 列表区 ===== */}
      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={USE_MOCK ? [] : viewHotels}
        renderItem={(h) => (
          <List.Item>
            <Card
              title={h.name_zh}
              extra={<Link to={`/hotel/${h.id}?${queryString}`}>查看详情</Link>}
            >
              <div>城市：{h.city}</div>
              <div>地址：{h.address}</div>
              <div>星级：{h.star_rating}</div>
              <div>起价：{getHotelMinPrice(h) ?? "-"}</div>
            </Card>
          </List.Item>
        )}
      />

      <div style={{ textAlign: "center", marginTop: 16 }}>
        <Button disabled={!hasMore} loading={loading} onClick={() => setPage((p) => p + 1)}>
          {hasMore ? "加载更多" : "没有更多了"}
        </Button>
      </div>
    </div>
  );
}