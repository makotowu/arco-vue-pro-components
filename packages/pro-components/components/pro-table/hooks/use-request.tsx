import { Ref, computed, reactive, ref, watch } from 'vue';
import { PaginationProps } from '@arco-design/web-vue';
import type { Filters, Sorter, Sorters, ProTableCacheConfig } from '../interface';
import useFetchData from '../form/use-fetch-data';
import { isEqual } from '../../_utils/is-equal';

export const useRequestData = ({
  props,
  emit,
  formSearch,
  sorter,
  sorters,
  filters,
  propsPagination,
  popupContainer,
  dataCache,
}: {
  props: any;
  emit: any;
  formSearch: Ref<Record<string, any>>;
  sorter: Ref<Sorter | undefined>;
  sorters: Ref<Sorters>;
  filters: Ref<Filters>;
  propsPagination: Ref<any>;
  popupContainer: Ref<HTMLElement | null | undefined>;
  dataCache: Ref<boolean | ProTableCacheConfig<any> | undefined>;
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
  const fetchData = computed(() => {
    if (!props.request) {
      return undefined;
    }
    return async (pageParams?: Record<string, any>) => {
      const actionParams = {
        ...(pageParams || {}),
        ...formSearch.value,
        ...props.params,
      };
      delete (actionParams as any)._timestamp;
      const response = await props.request?.(
        actionParams,
        sorters.value,
        filters.value
      );
      return response;
    };
  });

  const fetchPagination = computed(() =>
    typeof propsPagination.value === 'object'
      ? (propsPagination.value as PaginationProps)
      : { defaultCurrent: 1, defaultPageSize: 20, pageSize: 20, current: 1 }
  );
  const options = reactive({
    pageInfo: fetchPagination.value,
    effects: [props.params, formSearch, sorter, filters],
    getPopupContainer: () => popupContainer.value,
  });
  const action = useFetchData(fetchData.value, props, emit, options);
  const dataSourceInner = computed(() => {
    return props.request ? action.data.value : props.data || [];
  });

  const cachedDataSource = ref<any[]>([]);

  watch(
    [dataSourceInner, dataCache],
    ([nextData, cache]) => {
      const config = getCacheConfig(cache);
      if (!config.enabled) {
        cachedDataSource.value = nextData || [];
        return;
      }
      const compare = config.compare || isEqual;
      if (!compare(cachedDataSource.value, nextData)) {
        cachedDataSource.value = nextData || [];
      }
    },
    {
      immediate: true,
    }
  );

  const dataSource = computed(() => {
    const config = getCacheConfig(dataCache.value);
    return config.enabled ? cachedDataSource.value : dataSourceInner.value;
  });

  return {
    action,
    dataSource,
    fetchPagination,
  };
};
