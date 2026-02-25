// src/utils/hotelQuery.js

import { parseFacilities, stringifyFacilities } from "./facilities";
import { normalizeCity } from "./amap";

export const DEFAULT_HOTEL_QUERY = Object.freeze({
  city: "",
  keyword: "",
  check_in: null,
  check_out: null,
  guests:null,
  star_rating: null,
  min_price: null,
  max_price: null,
  facilities: [], // string[]
  sort: null, // 'price_asc' | 'price_desc' | null
  lat: null,
  lng: null,
});

function toIntOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toFloatOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toStr(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

export function parseHotelQueryFromSearchParams(sp) {
  const q = { ...DEFAULT_HOTEL_QUERY };

  q.city = toStr(sp.get("city"));
  q.keyword = toStr(sp.get("keyword"));
  q.check_in = sp.get("check_in") || null;
  q.check_out = sp.get("check_out") || null;

  const guestsRaw = sp.get("guests");
  const guests = toIntOrNull(guestsRaw);

  q.guests = guests != null && guests > 0 ? guests : null;

  q.star_rating = toIntOrNull(sp.get("star_rating"));
  q.min_price = toIntOrNull(sp.get("min_price"));
  q.max_price = toIntOrNull(sp.get("max_price"));

  q.facilities = parseFacilities(sp.get("facilities")) || [];
  q.sort = sp.get("sort") || null;

  q.lat = toFloatOrNull(sp.get("lat"));
  q.lng = toFloatOrNull(sp.get("lng"));

  return q;
}

export function stringifyHotelQueryToSearchParams(query) {
  const sp = new URLSearchParams();

  const city = normalizeCity(query.city);
  if (city) sp.set("city", city);

  if (query.keyword) sp.set("keyword", String(query.keyword));

  if (query.check_in) sp.set("check_in", String(query.check_in));
  if (query.check_out) sp.set("check_out", String(query.check_out));

  if (query.star_rating != null) sp.set("star_rating", String(query.star_rating));
  if (query.min_price != null) sp.set("min_price", String(query.min_price));
  if (query.max_price != null) sp.set("max_price", String(query.max_price));

  if (query.guests != null && query.guests !== "") sp.set("guests", String(query.guests));
  else sp.delete("guests");
  
  if (query.facilities?.length) sp.set("facilities", stringifyFacilities(query.facilities));
  if (query.sort) sp.set("sort", String(query.sort));

  if (query.lat != null) sp.set("lat", String(query.lat));
  if (query.lng != null) sp.set("lng", String(query.lng));

  return sp;
}