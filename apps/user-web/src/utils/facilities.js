import { FACILITY_DICT } from "../constants/facilities";

const VALID_SET = new Set(FACILITY_DICT.map((f) => f.id));

export function parseFacilities(value) {
  if (!value) return [];

  return String(value)
    .split(",")
    .map((s) => s.trim())
    .filter((id) => VALID_SET.has(id)); // 只允许合法英文 key
}

export function stringifyFacilities(list) {
  if (!Array.isArray(list) || list.length === 0) return undefined;

  return list
    .map((id) => String(id).trim())
    .filter((id) => VALID_SET.has(id))
    .join(",");
}