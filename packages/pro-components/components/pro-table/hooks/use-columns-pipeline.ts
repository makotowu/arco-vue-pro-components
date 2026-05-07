import { Ref, ref, shallowRef, watch, onBeforeUnmount } from 'vue';
import { debounce } from 'lodash';
import type {
  ActionType,
  ColumnEmptyText,
  ColumnStateType,
  ProColumns,
  ProTableTypes,
  RenderData,
  ProTableCacheConfig,
} from '../interface';
import { genProColumnToColumn, loopFilter } from '../utils';
import { isEqual } from '../../_utils/is-equal';

export const useColumnsPipeline = (params: {
  columns: Ref<ProColumns[]>;
  type: Ref<ProTableTypes>;
  columnEmptyText: Ref<ColumnEmptyText>;
  columnsState: Ref<ColumnStateType | undefined>;
  columnsCache: Ref<boolean | ProTableCacheConfig<any> | undefined>;
  actionRef: Ref<ActionType | undefined>;
  slots: any;
  renderIndex: (data: RenderData) => any;
}) => {
  const getCacheConfig = (
    cache?: boolean | ProTableCacheConfig<any>
  ): ProTableCacheConfig<any> & { enabled: boolean } => {
    if (cache === true) {
      return { enabled: true };
    }
    if (cache && typeof cache === 'object') {
      return {
        enabled: cache.enabled !== false,
        compare: cache.compare,
      };
    }
    return { enabled: false };
  };

  const columnsMap = ref<any>({});
  const setColumnsMap = (data: any) => {
    columnsMap.value = data;
  };

  const tableColumns = shallowRef<any[]>([]);
  const processedColumns = shallowRef<any[]>([]);

  watch(
    [
      () => params.columns.value,
      () => params.type.value,
      () => params.columnEmptyText.value,
      columnsMap,
      params.columnsCache,
    ],
    () => {
      const innerColumns = genProColumnToColumn({
        columns: params.columns.value,
        type: params.type.value,
        columnEmptyText: params.columnEmptyText.value,
        action: params.actionRef,
        slots: {
          ...params.slots,
          index: params.renderIndex,
        },
      });

      const finalColumns = Object.keys(columnsMap.value).length === 0
        ? innerColumns
        : loopFilter(innerColumns, undefined, columnsMap);

      const cacheConfig = getCacheConfig(params.columnsCache.value);
      const compare = cacheConfig.compare || isEqual;

      if (cacheConfig.enabled) {
        if (!compare(tableColumns.value, innerColumns)) {
          tableColumns.value = innerColumns;
        }
        if (!compare(processedColumns.value, finalColumns)) {
          processedColumns.value = finalColumns;
        }
      } else {
        tableColumns.value = innerColumns;
        processedColumns.value = finalColumns;
      }
    },
    { immediate: true }
  );

  const initStorageColumnsMap = () => {
    const { persistenceType, persistenceKey } = params.columnsState.value || {};
    if (persistenceKey && persistenceType && typeof window !== 'undefined') {
      const storage = window[
        persistenceType as 'localStorage' | 'sessionStorage'
      ] as Storage | undefined;
      try {
        const storageValue = storage?.getItem(persistenceKey);
        if (storageValue) {
          setColumnsMap(JSON.parse(storageValue));
        } else {
          setColumnsMap({});
        }
      } catch (error) {
        console.warn(error);
      }
    }
  };

  initStorageColumnsMap();

  watch([params.columnsState], () => {
    initStorageColumnsMap();
  });

  const persistColumnsMap = debounce(
    (
      currentColumnsState: ColumnStateType | undefined,
      currentColumnsMap: Record<string, any>
    ) => {
      if (
        !currentColumnsState?.persistenceKey ||
        !currentColumnsState?.persistenceType
      ) {
        return;
      }
      if (typeof window === 'undefined') return;
      const { persistenceType, persistenceKey } = currentColumnsState;
      const storage = window[
        persistenceType as 'localStorage' | 'sessionStorage'
      ] as Storage | undefined;
      try {
        storage?.setItem(persistenceKey, JSON.stringify(currentColumnsMap));
      } catch (error) {
        console.warn(error);
        storage?.removeItem(persistenceKey);
      }
    },
    200
  );

  watch(
    [params.columnsState, columnsMap],
    ([currentColumnsState, currentColumnsMap]) => {
      persistColumnsMap(currentColumnsState, currentColumnsMap);
    }
  );

  onBeforeUnmount(() => {
    persistColumnsMap.cancel();
  });

  return {
    columnsMap,
    setColumnsMap,
    tableColumns,
    columns: processedColumns,
  };
};
