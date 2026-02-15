export function parseFacilities(value, validSet) {
  if (!value) return [];
  const arr = String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // 如果传了 validSet，就过滤掉非法项（防止用户手改 URL）
  return validSet ? arr.filter((x) => validSet.has(x)) : arr;
}

export function stringifyFacilities(list) {
  if (!Array.isArray(list) || list.length === 0) return undefined;
  return list.join(",");
}
