// src/utils/publicUrl.js
import { http } from "../api/http";

export function getApiOrigin() {
  const baseURL = http?.defaults?.baseURL || "http://localhost:3000/api";
  return String(baseURL).replace(/\/api\/?$/, "");
}

/** 把后端返回的 /uploads/xx 变成完整可访问 URL；http(s) 原样返回 */
export function toPublicUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;

  const origin = getApiOrigin();
  return `${origin}${u.startsWith("/") ? "" : "/"}${u}`;
}