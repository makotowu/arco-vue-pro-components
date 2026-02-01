import type { Data } from './types';

export const omit = <T extends Data, K extends keyof any>(
  object: T,
  path: Array<K>
): Omit<T, K> => {
  const result: any = {};
  const paths = new Set(path as any[]);

  for (const key in object) {
    if (!paths.has(key)) {
      result[key] = object[key];
    }
  }

  return result;
};
