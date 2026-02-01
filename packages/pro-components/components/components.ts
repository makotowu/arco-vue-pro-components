import type { App, Plugin } from 'vue';
import ProSelect from './pro-select';
import ProInputNumber from './pro-input-number';
import ProTable, { ProFormSearch } from './pro-table';

const components: Record<string, Plugin> = {
  ProSelect,
  ProInputNumber,
  ProTable,
  ProFormSearch,
};

const install = (app: App) => {
  for (const key of Object.keys(components)) {
    app.use(components[key]);
  }
};

const Components = {
  ...components,
  install,
};

export default Components;
