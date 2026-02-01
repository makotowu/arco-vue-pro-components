import { Ref, computed, ref, watch, onBeforeUnmount } from 'vue';
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

  const tableColumnsInner = computed(() => {
    return genProColumnToColumn({
      columns: params.columns.value,
      type: params.type.value,
      columnEmptyText: params.columnEmptyText.value,
      action: params.actionRef,
      slots: {
        ...params.slots,
        index: params.renderIndex,
      },
    });
  });

  const columnsInner = computed(() => {
    if (Object.keys(columnsMap.value).length === 0) {
      return tableColumnsInner.value;
    }
    return loopFilter(tableColumnsInner.value, undefined, columnsMap);
  });

  const cachedTableColumns = ref<any[]>([]);
  const cachedColumns = ref<any[]>([]);

  watch(
    [tableColumnsInner, params.columnsCache],
    ([nextColumns, cache]) => {
      const config = getCacheConfig(cache);
      if (!config.enabled) {
        cachedTableColumns.value = nextColumns || [];
        return;
      }
      const compare = config.compare || isEqual;
      if (!compare(cachedTableColumns.value, nextColumns)) {
        cachedTableColumns.value = nextColumns || [];
      }
    },
    {
      immediate: true,
    }
  );

  watch(
    [columnsInner, params.columnsCache],
    ([nextColumns, cache]) => {
      const config = getCacheConfig(cache);
      if (!config.enabled) {
        cachedColumns.value = nextColumns || [];
        return;
      }
      const compare = config.compare || isEqual;
      if (!compare(cachedColumns.value, nextColumns)) {
        cachedColumns.value = nextColumns || [];
      }
    },
    {
      immediate: true,
    }
  );

  const tableColumns = computed(() => {
    const config = getCacheConfig(params.columnsCache.value);
    return config.enabled ? cachedTableColumns.value : tableColumnsInner.value;
  });

  const columns = computed(() => {
    const config = getCacheConfig(params.columnsCache.value);
    return config.enabled ? cachedColumns.value : columnsInner.value;
  });

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
    },
    {
      deep: true,
    }
  );

  onBeforeUnmount(() => {
    persistColumnsMap.cancel();
  });

  return {
    columnsMap,
    setColumnsMap,
    tableColumns,
    columns,
  };
};
