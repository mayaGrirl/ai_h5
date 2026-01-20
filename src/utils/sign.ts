/**
 * 签名生成工具类
 */
export class SignatureGenerate {
  /**
   * 递归扁平化字典，支持按键排序
   */
  private static flattenDict<T extends Record<string, unknown>>(
    d: T,
    parentKey: string = '',
    sep: string = '.',
    sortKeys: boolean = true
  ): Record<string, unknown> {
    const items: [string, unknown][] = []
    const keys = sortKeys ? Object.keys(d).sort() : Object.keys(d)

    for (const k of keys) {
      const v = d[k]
      const newKey = parentKey ? `${parentKey}${sep}${k}` : k

      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const flattened = this.flattenDict(v as Record<string, unknown>, newKey, sep, sortKeys)
        for (const [key, value] of Object.entries(flattened)) {
          items.push([key, value])
        }
      } else if (Array.isArray(v)) {
        for (let i = 0; i < v?.length; i++) {
          items.push([`${newKey}${sep}${i}`, v[i]])
        }
      } else {
        items.push([newKey, v])
      }
    }

    return Object.fromEntries(items)
  }

  /**
   * 将JSON对象转换为查询字符串
   */
  public static jsonToQueryString(
    data: Record<string, unknown>,
    sortKeys: boolean = true,
    urlEncode: boolean = false
  ): string {
    const flattened = this.flattenDict(data, '', '.', sortKeys)
    const queryParts: string[] = []

    for (const [k, v] of Object.entries(flattened)) {
      const strVal = v === null || v === undefined ? '' : String(v)
      let key = k

      if (urlEncode) {
        key = encodeURIComponent(key)
      }

      queryParts.push(`${key}=${strVal}`)
    }

    return queryParts.join('&')
  }
}
