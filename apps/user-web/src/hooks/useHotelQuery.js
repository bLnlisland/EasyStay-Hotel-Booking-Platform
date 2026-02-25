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
    const cleanedPatch = Object.fromEntries(
      Object.entries(patch || {}).filter(([, v]) => v !== undefined)
    );

    const next = { ...query, ...cleanedPatch };

    // ✅ 关键：null/"" 代表删除
    Object.keys(cleanedPatch).forEach((k) => {
      const v = cleanedPatch[k];
      if (v === null || v === "") delete next[k];
    });

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