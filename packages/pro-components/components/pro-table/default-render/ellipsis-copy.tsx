import type { VNodeChild } from 'vue';
import { TypographyParagraph } from '@arco-design/web-vue';
import type { ProColumns } from '../interface';

export const reduceWidth = (
  width?: string | number
): string | number | undefined => {
  if (width === undefined) {
    return width;
  }
  if (typeof width === 'string') {
    if (!width.includes('calc')) {
      return `calc(100% - ${width})`;
    }
    return width;
  }
  if (typeof width === 'number') {
    return (width as number) - 32;
  }
  return width;
};

export const renderEllipsisCopy = (
  dom: VNodeChild,
  item: ProColumns,
  text: string
) => {
  if (item.copyable || item.ellipsis) {
    return (
      <TypographyParagraph
        style={{
          width: reduceWidth(item.width),
          margin: 0,
          padding: 0,
        }}
        copyText={text}
        copyable={item.copyable as any}
        ellipsis={
          item.ellipsis
            ? {
                showTooltip: { type: 'tooltip', props: { position: 'bottom' } },
              }
            : false
        }
      >
        {dom}
      </TypographyParagraph>
    );
  }
  return dom;
};
