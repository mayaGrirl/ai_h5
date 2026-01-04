/**
 * 是否为空
 */
export function isEmpty(v: unknown): boolean {
  return (
    v === null ||
    v === undefined ||
    (typeof v === "string" && v.trim() === "")
  );
}

/**
 * 转换***
 * @param str
 * @param start
 * @param end
 * @param mask
 */
export function maskString(str: string, start = 2, end = 2, mask = "**") {
  if (str.length <= start + end) return str;
  return `${str.slice(0, start)}${mask}${str.slice(-end)}`;
}
