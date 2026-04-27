import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  toRef,
  watch,
  watchEffect,
} from 'vue';
import { IconDown } from '@arco-design/web-vue/es/icon';
import type { SearchConfig } from '../interface';
import { omit } from '../../_utils/omit';
import ResponsiveObserve, { ScreenMap } from '../../_utils/responsive-observe';

export const useFormSearchState = ({
  props,
  emit,
  t,
}: {
  props: any;
  emit: any;
  t: Function;
}) => {
  const columns = toRef(props, 'columns');
  const defaultFormData = toRef(props, 'defaultFormData');
  const formSearchRef = ref();
  const isForm = computed(() => props.type === 'form');
  const defaultSearchConfig = {
    searchText: t('tableForm.search'),
    resetText: t('tableForm.reset'),
    submitText: t('tableForm.submit'),
    collapseRender: (collapsed: boolean) => {
      if (collapsed) {
        return (
          <>
            {t('tableForm.collapsed')}
            <IconDown
              style={{
                verticalAlign: 'middle',
                fontSize: '16px',
                marginLeft: '8px',
                transition: '0.3s all',
                transform: `rotate(${collapsed ? 0 : 0.5}turn)`,
              }}
            />
          </>
        );
      }
      return (
        <>
          {t('tableForm.expand')}
          <IconDown
            style={{
              verticalAlign: 'baseline',
              fontSize: '16px',
              marginLeft: '8px',
              transition: '0.3s all',
              transform: `rotate(${collapsed ? 0 : 0.5}turn)`,
            }}
          />
        </>
      );
    },
  };
  const searchConfig = computed((): SearchConfig => {
    return Object.assign(defaultSearchConfig, props.search) as SearchConfig;
  });

  const resolvedLayout = computed(() => {
    return (
      searchConfig.value.layout || (isForm.value ? 'vertical' : 'horizontal')
    );
  });

  const resolveInlineLimit = (screens?: ScreenMap) => {
    const current = screens || {};
    if (current.xxl) return 5;
    if (current.xl) return 4;
    if (current.lg || current.md) return 3;
    if (current.sm) return 2;
    return 0;
  };

  const resolveGridLimit = (screens?: ScreenMap) => {
    const current = screens || {};
    if (resolvedLayout.value === 'vertical') {
      if (current.xxl || current.xl || current.lg || current.md || current.sm)
        return 1;
      return 0;
    }
    if (current.xxl || current.xl || current.lg || current.md) return 2;
    if (current.sm) return 1;
    return 0;
  };

  const inlineCollapsedLimit = ref(resolveInlineLimit());
  const gridCollapsedLimit = ref(resolveGridLimit());
  let responsiveToken = '';

  const formModel = ref<{ [propName: string]: any }>(
    props.defaultFormData || {}
  );
  const collapsed = ref(searchConfig.value.collapsed ?? true);

  const handleReset = () => {
    emit('reset', formModel.value);
  };
  const onReset = () => {
    formSearchRef.value?.resetFields();
    handleReset();
  };
  const onSubmit = async () => {
    const res = await formSearchRef.value?.validate();
    if (!res) {
      emit('submit', formModel.value);
    }
  };

  function getFieldsValues() {
    return formModel.value;
  }

  const startObserve = () => {
    if (responsiveToken) {
      return;
    }
    if (typeof window === 'undefined' || !window.matchMedia) {
      inlineCollapsedLimit.value = resolveInlineLimit();
      gridCollapsedLimit.value = resolveGridLimit();
      return;
    }
    try {
      responsiveToken = ResponsiveObserve.subscribe((screens) => {
        const nextLimit = resolveInlineLimit(screens);
        if (inlineCollapsedLimit.value !== nextLimit) {
          inlineCollapsedLimit.value = nextLimit;
        }
        const nextGridLimit = resolveGridLimit(screens);
        if (gridCollapsedLimit.value !== nextGridLimit) {
          gridCollapsedLimit.value = nextGridLimit;
        }
      });
    } catch (error) {
      inlineCollapsedLimit.value = resolveInlineLimit();
      gridCollapsedLimit.value = resolveGridLimit();
      responsiveToken = '';
    }
  };

  const stopObserve = () => {
    if (responsiveToken) {
      ResponsiveObserve.unsubscribe(responsiveToken);
      responsiveToken = '';
    }
  };

  const shouldObserve = computed(() => {
    if (resolvedLayout.value === 'inline') {
      return true;
    }
    if (!isForm.value && resolvedLayout.value === 'horizontal') {
      return true;
    }
    return false;
  });

  watch(resolvedLayout, () => {
    gridCollapsedLimit.value = resolveGridLimit();
  });

  onMounted(() => {
    if (shouldObserve.value) {
      startObserve();
    }

    if (props.type === 'table') {
      emit('submit', defaultFormData.value, true);
    }
  });

  watch(shouldObserve, (next) => {
    if (next) {
      startObserve();
      return;
    }
    stopObserve();
  });

  onUnmounted(() => {
    stopObserve();
  });

  watchEffect(() => {
    if (typeof props.formRef === 'function' && formSearchRef.value) {
      formSearchRef.value.submit = onSubmit;
      formSearchRef.value.reset = onReset;
      formSearchRef.value.getFieldsValues = getFieldsValues;
      props.formRef(formSearchRef.value);
    }
  });

  const columnsList = computed(() => {
    return (
      columns.value
        .filter((item) => {
          if (item.hideInSearch && props.type !== 'form') {
            return false;
          }
          if (props.type === 'form' && item.hideInForm) {
            return false;
          }
          if (
            !(item.valueType === 'index' || item.valueType === 'indexBorder') &&
            (item.key || item.dataIndex)
          ) {
            return true;
          }
          return false;
        })
        .sort((a, b) => {
          if (a && b) {
            return (b.order || 0) - (a.order || 0);
          }
          if (a && a.order) {
            return -1;
          }
          if (b && b.order) {
            return 1;
          }
          return 0;
        }) || []
    );
  });

  const gridKey = ref(Date.now());
  watch(
    () => columnsList.value.map((item) => item.key || item.dataIndex).join(','),
    (newKeys, oldKeys) => {
      if (newKeys !== oldKeys) {
        gridKey.value = Date.now();
      }
    }
  );

  const handleSubmit = ({
    values,
    errors,
  }: {
    values?: Record<string, any>;
    errors?: Record<string, any> | undefined;
  } = {}) => {
    if (!errors) {
      emit('submit', values || {});
    }
  };

  const gridProps = computed(() => {
    if (searchConfig.value.layout === 'vertical') {
      return {
        cols: 1,
        collapsed: collapsed.value,
      };
    }
    return props.type === 'form'
      ? {
          cols: 1,
          collapsed: false,
        }
      : {
          cols: { xs: 1, sm: 2, md: 3 },
          collapsed: collapsed.value,
        };
  });
  const formProps = computed(() => {
    const data =
      typeof searchConfig.value.formProps === 'function'
        ? searchConfig.value.formProps({ formModel, type: props.type })
        : searchConfig.value.formProps;
    return isForm.value ? data : omit(data || {}, ['rules', 'disabled']);
  });

  return {
    searchConfig,
    isForm,
    formSearchRef,
    formModel,
    collapsed,
    inlineCollapsedLimit,
    gridCollapsedLimit,
    columnsList,
    gridKey,
    gridProps,
    formProps,
    onSubmit,
    onReset,
    handleReset,
    handleSubmit,
  };
};
