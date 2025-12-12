/**
 * 签名生成工具类
 */
export class SignatureGenerate {
  /**
   * 递归扁平化字典，支持按键排序
   * @param d 输入对象
   * @param parentKey 父级键名
   * @param sep 分隔符
   * @param sortKeys 是否按键排序
   * @returns 扁平化后的对象
   */
  private static flattenDict<T extends Record<string, unknown>>(
    d: T,
    parentKey: string = '',
    sep: string = '.',
    sortKeys: boolean = true,
  ): Record<string, unknown> {
    const items: [string, unknown][] = [];
    const keys = sortKeys ? Object.keys(d).sort() : Object.keys(d);

    for (const k of keys) {
      const v = d[k];
      const newKey = parentKey ? `${parentKey}${sep}${k}` : k;

      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        // 处理对象
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const flattened = this.flattenDict(v, newKey, sep, sortKeys);
        for (const [key, value] of Object.entries(flattened)) {
          items.push([key, value]);
        }
      } else if (Array.isArray(v)) {
        // 处理数组
        for (let i = 0; i < v?.length; i++) {
          items.push([`${newKey}${sep}${i}`, v[i]]);
        }
      } else {
        // 处理基本类型
        items.push([newKey, v]);
      }
    }

    return Object.fromEntries(items);
  }

  /**
   * 将JSON对象转换为查询字符串
   * @param data 输入对象
   * @param sortKeys 是否按键排序
   * @param urlEncode 是否进行URL编码
   * @returns 查询字符串
   */
  public static jsonToQueryString(
    data: Record<string, unknown>,
    sortKeys: boolean = true,
    urlEncode: boolean = false,
  ): string {
    const flattened = this.flattenDict(data, '', '.', sortKeys);
    const queryParts: string[] = [];

    for (const [k, v] of Object.entries(flattened)) {
      const strVal = v === null || v === undefined ? '' : String(v);
      let key = k;

      if (urlEncode) {
        key = encodeURIComponent(key);
        // strVal = encodeURIComponent(strVal);  不能编译，有汉字或者是其他特殊符号会被编译
      }

      queryParts.push(`${key}=${strVal}`);
    }

    return queryParts.join('&');
  }

  /**
   * 执行所有测试用例
   */
  public static runTests(): void {
    const testCases: Array<{
      data: Record<string, unknown>;
      expected: string;
      needEncode: boolean;
    }> = [
      {
        data: {name: 'Alice', age: 25, country: 'USA'},
        expected: 'age=25&country=USA&name=Alice',
        needEncode: false,
      },
      {
        data: {
          user: {
            name: 'Bob',
            address: {
              city: 'Shanghai',
              zip: '200000',
            },
          },
          is_active: true,
        },
        expected:
          'is_active=true&user.address.city=Shanghai&user.address.zip=200000&user.name=Bob',
        needEncode: false,
      },
      {
        data: {
          id: 1001,
          tags: ['python', 'json', 'test'],
          metadata: {
            author: 'Charlie',
            keywords: ['a', 'b', 'c'],
          },
        },
        expected:
          'id=1001&metadata.author=Charlie&metadata.keywords.0=a&metadata.keywords.1=b&metadata.keywords.2=c&tags.0=python&tags.1=json&tags.2=test',
        needEncode: false,
      },
      {
        data: {query: 'name=John&age=30', symbols: '!@#$%'},
        expected: 'query=name%3DJohn%26age%3D30&symbols=%21%40%23%24%25',
        needEncode: true,
      },
      {
        data: {is_valid: false, value: null, nested: {empty: '', flag: true}},
        expected: 'is_valid=false&nested.empty=&nested.flag=true&value=',
        needEncode: false,
      },
      {
        data: {a: 1, b: [{x: 2}, {y: 3}], c: {d: {e: 4}, f: [5, 6]}},
        expected: 'a=1&b.0.x=2&b.1.y=3&c.d.e=4&c.f.0=5&c.f.1=6',
        needEncode: false,
      },
    ];

    testCases.forEach(({data, expected, needEncode}, i) => {
      const result = this.jsonToQueryString(data, true, needEncode);
      const status = result === expected ? 'PASS' : 'FAIL';

      console.log(`Test Case ${i + 1}: ${status}`);
      console.log(`  Expected: ${expected}`);
      console.log(`  Result:   ${result}\n`);
    });
  }
}
