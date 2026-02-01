import type { VNodeChild } from 'vue';
import type { StatusType, ValueEnumMap, ValueEnumObj } from '../interface';
import TableStatus from '../status';

const getType = (obj: any) => {
  const match = Object.prototype.toString
    .call(obj)
    .match(/^\[object (.*)\]$/);
  const type = match ? match[1].toLowerCase() : 'unknown';
  if (type === 'string' && typeof obj === 'object') return 'object';
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  return type;
};

export const ObjToMap = (
  value: ValueEnumObj | ValueEnumMap | undefined
): ValueEnumMap | undefined => {
  if (!value) {
    return value;
  }
  if (getType(value) === 'map') {
    return value as ValueEnumMap;
  }
  return new Map(Object.entries(value));
};

export const parsingText = (
  text: string | number,
  valueEnum?: ValueEnumMap,
  pure?: boolean
) => {
  if (!valueEnum) {
    return text;
  }

  if (!valueEnum.has(text) && !valueEnum.has(`${text}`)) {
    return text;
  }

  const domText = (valueEnum.get(text) || valueEnum.get(`${text}`)) as {
    text: VNodeChild;
    status: keyof StatusType;
  };
  if (domText.status) {
    if (pure) {
      return domText.text;
    }
    const { status } = domText;
    const Status = TableStatus[(status || 'Default') as keyof typeof TableStatus];
    if (Status) {
      return Status({ text: domText.text });
    }
  }
  return domText.text || domText;
};
