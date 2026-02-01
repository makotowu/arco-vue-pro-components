import { Data } from './types';
import { isArray, isObject } from './is';

const pathCache = new Map<string, string[]>();

export const getValueByPath = <T = any>(
  obj: Data | undefined,
  path: string | undefined
): T | undefined => {
  if (!obj || !path) {
    return undefined;
  }
  
  // 快速路径：如果不包含特殊字符，直接访问
  if (path.indexOf('.') === -1 && path.indexOf('[') === -1) {
    return obj[path] as T;
  }

  let keys = pathCache.get(path);
  if (!keys) {
    keys = path.replace(/\[(\w+)\]/g, '.$1').split('.');
    pathCache.set(path, keys);
    // 限制缓存大小，防止内存泄漏
    if (pathCache.size > 1000) {
      pathCache.clear();
    }
  }

  if (keys.length === 0) {
    return undefined;
  }

  let temp = obj;

  for (let i = 0; i < keys.length; i++) {
    if ((!isObject(temp) && !isArray(temp)) || !keys[i]) {
      return undefined;
    }
    if (i !== keys.length - 1) {
      temp = temp[keys[i]] as any;
    } else {
      return temp[keys[i]] as T;
    }
  }

  return undefined;
};

export const setValueByPath = (
  obj: Data | undefined,
  path: string | undefined,
  value: any
) => {
  if (!obj || !path) {
    return;
  }
  path = path.replace(/\[(\w+)\]/g, '.$1');
  const keys = path.split('.');
  if (keys.length === 0) {
    return;
  }

  let temp = obj;

  for (let i = 0; i < keys.length; i++) {
    if ((!isObject(temp) && !isArray(temp)) || !keys[i]) {
      return;
    }
    if (i !== keys.length - 1) {
      temp = temp[keys[i]] as any;
    } else {
      temp[keys[i]] = value;
    }
  }
};
