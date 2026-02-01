import { Ref, computed, watch, ref } from 'vue';
import { isArray } from '../../_utils/is';
import { flattenChildren } from '../utils';
import { isEqual } from '../../_utils/is-equal';

export const useSelectionPipeline = (params: {
  dataSource: Ref<any[]>;
  rowKey: Ref<string>;
  selectedRowKeys: Ref<any[]>;
  selectedRows: Ref<any[]>;
  noRowSelection: Ref<boolean>;
  loading: Ref<boolean | undefined>;
}) => {
  const dataSourceMap = computed(() => {
    return params.noRowSelection.value
      ? {}
      : flattenChildren(params.dataSource.value, params.rowKey.value);
  });

  const selectedRowsMap = computed(() => {
    return params.noRowSelection.value
      ? {}
      : flattenChildren(params.selectedRows.value, params.rowKey.value);
  });

  const selectedRowsCache = ref<Record<string, any>>({});
  const lastSelectedRowKeys = ref<any[]>([]);

  watch(
    [
      params.selectedRowKeys,
      dataSourceMap,
      params.noRowSelection,
      params.loading,
    ],
    ([selectedRowKeys, currentDataSourceMap, noRowSelection, loading]) => {
      if (loading || noRowSelection) {
        return;
      }
      const nextKeys = isArray(selectedRowKeys) ? selectedRowKeys : [];
      if (!nextKeys.length) {
        lastSelectedRowKeys.value = [];
        selectedRowsCache.value = {};
        if (params.selectedRows.value.length) {
          params.selectedRows.value = [];
        }
        return;
      }
      const nextKeyStrings = nextKeys.map((item) => String(item));
      const prevKeyStrings = lastSelectedRowKeys.value.map((item) =>
        String(item)
      );
      const nextKeySet = new Set(nextKeyStrings);
      const prevKeySet = new Set(prevKeyStrings);
      nextKeys.forEach((rawKey, index) => {
        const key = nextKeyStrings[index];
        if (!prevKeySet.has(key)) {
          const row =
            currentDataSourceMap[rawKey] || selectedRowsMap.value[rawKey];
          if (row) {
            selectedRowsCache.value[key] = row;
          }
        }
      });
      for (const key of prevKeyStrings) {
        if (!nextKeySet.has(key)) {
          delete selectedRowsCache.value[key];
        }
      }
      const rows: any[] = nextKeys
        .map((item) => {
          const key = String(item);
          const row =
            selectedRowsCache.value[key] ||
            currentDataSourceMap[item] ||
            selectedRowsMap.value[item];
          if (row) {
            selectedRowsCache.value[key] = row;
          }
          return row;
        })
        .filter(Boolean);
      if (!isEqual(rows, params.selectedRows.value)) {
        params.selectedRows.value = rows;
      }
      lastSelectedRowKeys.value = nextKeys;
    },
    {
      immediate: true,
    }
  );

  return {
    dataSourceMap,
    selectedRowsMap,
  };
};
