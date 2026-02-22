// src/hooks/useHotelQuery.js
import { useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_HOTEL_QUERY,
  parseHotelQueryFromSearchParams,
  stringifyHotelQueryToSearchParams,
} from "../utils/hotelQuery";

export function useHotelQuery() {
  const [sp, setSp] = useSearchParams();

  const query = useMemo(() => {
    try {
      return parseHotelQueryFromSearchParams(sp);
    } catch {
      return { ...DEFAULT_HOTEL_QUERY };
    }
  }, [sp]);

  const updateQuery = useCallback(
    (patch) => {
      // ✅ 关键：patch 里 value === undefined 的字段不要覆盖原值
      const cleanedPatch = Object.fromEntries(
        Object.entries(patch || {}).filter(([, v]) => v !== undefined)
      );

      const next = { ...query, ...cleanedPatch };
      const nextSp = stringifyHotelQueryToSearchParams(next);
      setSp(nextSp, { replace: true });
    },
    [query, setSp]
  );

  const queryString = useMemo(
    () => stringifyHotelQueryToSearchParams(query).toString(),
    [query]
  );

  return { query, updateQuery, queryString };
}