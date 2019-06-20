/* eslint-disable react/react-in-jsx-scope, react/no-this-in-sfc */

import { storiesOf } from '@storybook/vue';
import { action } from '@storybook/addon-actions';

import legend from './legend.js';

const makeLegend = data => ({
  components: { graphLegend: legend },
  data() {
    return data;
  },
  template: `
    <div class="chart">
      <graphLegend
        :modules="legendData.modules"
        :interval="interval"
        :date="legendData.date"
        @package-focus="handlePackageFocus"
        @package-blur="handlePackageBlur"
        @legend-blur="handleLegendBlur"
        @legend-focus="handleLegendFocus"
      >
      </graphLegend>
    </div>
  `,
  methods: {
    handlePackageFocus: action('packageFocus'),
    handlePackageBlur: action('packageBlur'),
    handleLegendFocus: action('legendFocus'),
    handleLegendBlur: action('legendBlur'),
  },
});

storiesOf('legend', module)
  .add('weekly', () =>
    makeLegend({
      legendData: {
        modules: [
          {
            color: '#2196F3',
            downloads: 1606437,
            name: 'log4js',
          },
          {
            color: '#f44336',
            downloads: 3228961,
            name: 'winston',
          },
        ],
        date: new Date(1543467600000),
      },
      interval: 7,
    }),
  )
  .add('daily', () =>
    makeLegend({
      legendData: {
        modules: [
          {
            color: '#2196F3',
            downloads: 310143,
            name: 'log4js',
          },
          {
            color: '#f44336',
            downloads: 615741,
            name: 'winston',
          },
        ],
        date: new Date(1543467600000),
      },
      interval: 1,
    }),
  )
  .add('monthly', () =>
    makeLegend({
      legendData: {
        modules: [
          {
            color: '#2196F3',
            downloads: 6343252,
            name: 'log4js',
          },
          {
            color: '#f44336',
            downloads: 13840361,
            name: 'winston',
          },
        ],
        date: new Date(1543467600000),
      },
      interval: 30,
    }),
  );
