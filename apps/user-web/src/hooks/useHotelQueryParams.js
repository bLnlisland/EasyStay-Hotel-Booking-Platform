import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";

const DATE_FMT = "YYYY-MM-DD";

export function useHotelQueryParams(defaults = {}) {
  const [sp, setSp] = useSearchParams();

  // 统一读取（有默认值）
  const query = useMemo(() => {
    const get = (k, d = "") => sp.get(k) ?? d;

    return {
      city: get("city", defaults.city ?? ""),
      keyword: get("keyword", defaults.keyword ?? ""),
      check_in: get("check_in", defaults.check_in ?? ""),
      check_out: get("check_out", defaults.check_out ?? ""),
      guests: get("guests", String(defaults.guests ?? 2)),
      star_rating: get("star_rating", defaults.star_rating ?? ""),
      min_price: get("min_price", defaults.min_price ?? ""),
      max_price: get("max_price", defaults.max_price ?? ""),
      facilities: get("facilities", defaults.facilities ?? ""), // 逗号串
    };
  }, [sp, defaults]);

  // RangePicker 直接用的 value
  const dateValue = useMemo(() => {
    if (!query.check_in || !query.check_out) return null;
    const a = dayjs(query.check_in, DATE_FMT);
    const b = dayjs(query.check_out, DATE_FMT);
    if (!a.isValid() || !b.isValid()) return null;
    return [a, b];
  }, [query.check_in, query.check_out]);

  // 内部工具：合并并写回 URL
  const mergeParams = (patch, opts = { replace: true }) => {
    const next = new URLSearchParams(sp);

    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") next.delete(k);
      else next.set(k, String(v));
    });

    setSp(next, opts);
  };

  // 给日期选择用
  const setDates = (dates) => {
    if (!dates || dates.length !== 2) {
      mergeParams({ check_in: "", check_out: "" });
      return;
    }
    mergeParams({
      check_in: dates[0].format(DATE_FMT),
      check_out: dates[1].format(DATE_FMT),
    });
  };

  const toQueryString = () => sp.toString();

  return { sp, query, dateValue, setDates, mergeParams, toQueryString };
}
