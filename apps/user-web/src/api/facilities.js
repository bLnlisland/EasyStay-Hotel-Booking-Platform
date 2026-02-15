import { http } from "./http";

let _cache = null;

export async function fetchFacilityOptions() {
  if (_cache) return _cache;

  const res = await http.get("/hotels/facilities/options");

  if (!res?.success) return [];

  // ✅ 真实结构
  const list = res.data?.facilities ?? [];

  _cache = list;
  return list;
}
