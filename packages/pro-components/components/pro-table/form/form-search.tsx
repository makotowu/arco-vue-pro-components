import {
  PropType,
  defineComponent,
  Ref,
  cloneVNode,
} from 'vue';
import {
  Form,
  Grid,
  FormItem,
  GridItem,
  RadioGroup,
  CheckboxGroup,
  Upload,
  Space,
  Button,
  Input,
  Textarea,
  DatePicker,
  RangePicker,
  TimePicker,
  Switch,
} from '@arco-design/web-vue';
import ProSelect from '../../pro-select';
import ProInputNumber from '../../pro-input-number';
import { useI18n } from '../../../locale/index';
import type {
  ProColumns,
  ProTableTypes,
  RenderFormItemData,
  SearchConfig,
  FormOptionProps,
} from '../interface';
import {
  ObjToMap,
  genColumnKey,
  parsingValueEnumToArray,
  runFunction,
} from '../utils';
import { getPrefixCls } from '../../_utils';
import { ProInputNumberType } from '../../pro-input-number';
import { omit } from '../../_utils/omit';
import { useFormSearchState } from './use-form-search-state';

const inputDecimalTypes = ['digit', 'decimal', 'money', 'percent'];
export const renderFormInput = (
  item: ProColumns,
  type: ProTableTypes,
  formModel: Ref,
  formRef: Ref,
  slots: any,
  t: any
) => {
  const data: RenderFormItemData = {
    item,
    formModel,
    formRef,
    type,
  };
  if (item.renderFormItem) {
    return item.renderFormItem(data);
  }
  if (item.formSlotName && slots?.[item.formSlotName]) {
    return slots[item.formSlotName]?.(data)[0];
  }
  const valueType =
    typeof item.valueType === 'function' ? item.valueType({}) : item.valueType;
  let options: {
    value: string | number;
    text: string;
    label: string;
  }[] = [];
  if (item.valueEnum) {
    options = parsingValueEnumToArray(
      ObjToMap(runFunction(item.valueEnum, data))
    );
  }
  if (!valueType || valueType === 'text') {
    const { valueEnum } = item;
    if (valueEnum) {
      return (
        <ProSelect
          style={{
            width: '100%',
          }}
          columnKey={item.key}
          options={options}
          placeholder={t('tableForm.selectPlaceholder')}
          {...item.fieldProps}
        />
      );
    }
    return (
      <Input
        placeholder={t('tableForm.inputPlaceholder')}
        allowClear
        {...item.fieldProps}
      />
    );
  }
  if (valueType === 'select') {
    return (
      <ProSelect
        style={{
          width: '100%',
        }}
        columnKey={item.key}
        placeholder={t('tableForm.selectPlaceholder')}
        options={options}
        {...item.fieldProps}
      />
    );
  }
  if (valueType === 'date') {
    return (
      <DatePicker
        format="YYYY-MM-DD"
        style={{
          width: '100%',
        }}
        {...item.fieldProps}
      />
    );
  }

  if (valueType === 'dateTime') {
    return (
      <DatePicker
        showTime
        format="YYYY-MM-DD HH:mm:ss"
        style={{
          width: '100%',
        }}
        {...item.fieldProps}
      />
    );
  }

  if (valueType === 'dateRange') {
    return (
      <RangePicker
        style={{
          width: '100%',
        }}
        {...item.fieldProps}
      />
    );
  }
  if (valueType === 'dateTimeRange') {
    return (
      <RangePicker
        showTime
        style={{
          width: '100%',
        }}
        {...item.fieldProps}
      />
    );
  }

  if (valueType === 'time') {
    return (
      <TimePicker
        style={{
          width: '100%',
        }}
        {...item.fieldProps}
      />
    );
  }
  if (valueType === 'textarea' && type === 'form') {
    return (
      <Textarea
        placeholder={t('tableForm.inputPlaceholder')}
        {...item.fieldProps}
      />
    );
  }
  if (valueType === 'checkbox') {
    return <CheckboxGroup options={options} {...item.fieldProps} />;
  }

  if (valueType === 'radio' || valueType === 'radioButton') {
    return (
      <RadioGroup
        type={valueType === 'radioButton' ? 'button' : 'radio'}
        options={options}
        {...item.fieldProps}
      />
    );
  }
  if (valueType === 'switch') {
    return <Switch checkedValue={0} uncheckedValue={1} {...item.fieldProps} />;
  }
  if (valueType === 'uploadFile') {
    return <Upload action="/" {...item.fieldProps} multiple={false} />;
  }
  if (typeof valueType === 'string' && inputDecimalTypes.includes(valueType)) {
    return (
      <ProInputNumber
        type={valueType as ProInputNumberType}
        {...item.fieldProps}
      />
    );
  }
  return (
    <Input
      placeholder={t('tableForm.inputPlaceholder')}
      allowClear
      {...item.fieldProps}
    />
  );
};

export default defineComponent({
  name: 'ProFormSearch',
  props: {
    columns: {
      type: Array as PropType<ProColumns[]>,
      default: () => [],
    },
    search: {
      type: [Object, Boolean] as PropType<SearchConfig | boolean>,
      default: true,
    },
    type: {
      type: String as PropType<ProTableTypes>,
      default: 'table',
    },
    defaultFormData: {
      type: Object,
      default: () => ({}),
    },
    formRef: {
      type: Function as PropType<(formRef: Ref) => void>,
    },
    submitButtonLoading: {
      type: Boolean,
    },
  },
  emits: {
    submit: (formData: Record<string, unknown>, firstLoad?: boolean) => true,
    reset: (formData?: Record<string, unknown>) => true,
    cancel: () => true,
  },
  setup(props, { slots, attrs, emit }) {
    const { t } = useI18n();
    const prefixCls = getPrefixCls('pro-table');
    const {
      searchConfig,
      isForm,
      formSearchRef,
      formModel,
      collapsed,
      columnsList,
      gridKey,
      gridProps,
      formProps,
      onSubmit,
      onReset,
      handleReset,
      handleSubmit,
    } = useFormSearchState({ props, emit, t });
    const renderGridFormItems = () => {
      return (
        <Grid
          {...gridProps.value}
          {...(props.search && props.search !== true
            ? props.search.gridProps
            : undefined)}
          key={gridKey.value}
        >
          {columnsList.value.map((item, index) => {
            const key = genColumnKey(
              item.key || item.dataIndex?.toString(),
              index
            );
            // 支持 function 的 title
            const getTitle = () => {
              if (item.title && typeof item.title === 'function') {
                return item.title(item, 'form');
              }
              return item.title;
            };
            const title = getTitle();
            const valueType =
              typeof item.valueType === 'function'
                ? item.valueType({})
                : item.valueType;
            const hidden = valueType === 'hidden';
            const formItemProps =
              typeof item.formItemProps === 'function'
                ? item.formItemProps({ formModel, item, type: props.type })
                : item.formItemProps;
            const gridItemProps = item.girdItemProps || {};
            return (
              <GridItem key={key} hidden={hidden} suffix={false} {...gridItemProps}>
                <FormItem
                  {...(isForm.value
                    ? formItemProps
                    : omit(formItemProps, [
                        'rules',
                        'disabled',
                        'required',
                        'validateStatus',
                        'validateTrigger',
                      ]))}
                  field={item.dataIndex}
                  label={
                    !hidden && typeof title === 'string' ? title : undefined
                  }
                  v-slots={{
                    label: () => {
                      return hidden ? '' : title;
                    },
                  }}
                >
                  {cloneVNode(
                    renderFormInput(
                      item,
                      props.type,
                      formModel,
                      formSearchRef,
                      slots,
                      t
                    ),
                    {
                      'modelValue': formModel.value[item.dataIndex],
                      'onUpdate:modelValue': (value: any) => {
                        // 更新表单数据
                        formModel.value[item.dataIndex] = value;
                      },
                    }
                  )}
                </FormItem>
              </GridItem>
            );
          })}
          <GridItem
            span={1}
            suffix
            style={[
              { 'text-align': 'right' },
              !isForm.value ? { 'margin-bottom': '20px' } : {},
            ]}
            v-slots={{
              default: ({ overflow }: { overflow: boolean }) => {
                return renderFormOption(collapsed.value ? overflow : true);
              },
            }}
          ></GridItem>
        </Grid>
      );
    };

    const renderFormOption = (showCollapseButton: boolean) => {
      if (searchConfig.value.optionRender === false) {
        return null;
      }
      const optionProps: FormOptionProps = {
        searchConfig: searchConfig.value,
        collapse: collapsed.value,
        setCollapse: (value: boolean) => {
          collapsed.value = value;
        },
        type: props.type,
        submit: onSubmit,
        reset: onReset,
        dom: [
          <Button onClick={onReset}>{searchConfig.value.resetText}</Button>,
          <Button
            type="primary"
            htmlType="submit"
            loading={props.submitButtonLoading}
          >
            {isForm.value
              ? searchConfig.value.submitText
              : searchConfig.value.searchText}
          </Button>,
        ],
        form: formSearchRef,
        showCollapseButton,
      };
      let dom: any = null;
      if (searchConfig.value.optionRender || slots?.['option-render']) {
        if (slots?.['option-render']) {
          dom = slots?.['option-render'](optionProps);
        }
        if (searchConfig.value.optionRender) {
          dom = searchConfig.value.optionRender(optionProps);
        }
      }
      return (
        <Space size={16}>
          <Space>{dom || optionProps.dom}</Space>
          {!isForm.value && showCollapseButton && (
            <a
              class={`${prefixCls}-collapse-button`}
              onClick={() => {
                collapsed.value = !collapsed.value;
              }}
            >
              {searchConfig.value.collapseRender &&
                searchConfig.value.collapseRender(collapsed.value)}
            </a>
          )}
        </Space>
      );
    };
    const render = () => (
      <Form
        layout={
          searchConfig.value.layout ||
          (isForm.value ? 'vertical' : 'horizontal')
        }
        {...formProps.value}
        model={formModel.value}
        ref={formSearchRef}
        onSubmit={handleSubmit}
      >
        {renderGridFormItems()}
      </Form>
    );
    return {
      render,
      selfSubmit: handleSubmit,
      selfReset: handleReset,
      formSearchRef,
    };
  },
  methods: {
    submit(data: any) {
      return this.selfSubmit(data);
    },
    reset() {
      return this.selfReset();
    },
  },
  render() {
    return this.render();
  },
});
