// src/api/facilities.js
import { http } from "./http";

let _cache = null;

export async function fetchFacilityOptions() {
  if (_cache) return _cache;

  const res = await http.get("/hotels/facilities/options");
  const payload = res?.data ?? res;
  const ok = payload?.success ?? true;
  const data = payload?.data ?? payload;

  if (!ok) return [];

  const list = data?.facilities ?? []; // [{id,name,icon,category}]
  _cache = list;
  return list;
}