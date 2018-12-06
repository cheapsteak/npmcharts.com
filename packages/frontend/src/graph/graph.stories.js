import { storiesOf } from '@storybook/vue';

import processPackagesStats from 'frontend/src/utils/processPackagesStats';
import standardizeNpmPackageResponse from 'utils/stats/standardizeNpmPackageResponse';
import dummyData from 'utils/dummyData';

import graph from './graph.js';

const makeGraph = data => ({
  components: { graph },
  data() {
    return data;
  },
  template: `
    <main style="height: 100%;">
      <div class="chart-container">
        <graph
          class="chart"
          :module-names="moduleNames"
          :module-data="moduleData"
          :interval="interval"
          :is-minimal-mode="isMinimalMode"
        >
        </graph>
      </div>
    </main>
  `,
});

storiesOf('graph', module)
  .add('log4js, winston | weekly', () =>
    makeGraph({
      moduleNames: ['log4js', 'winston'],
      moduleData: processPackagesStats(
        standardizeNpmPackageResponse(dummyData['log4js,winston']),
      ),
      isMinimalMode: false,
      interval: 7,
    }),
  )
  .add('log4js, winston | daily', () =>
    makeGraph({
      moduleNames: ['log4js', 'winston'],
      moduleData: processPackagesStats(
        standardizeNpmPackageResponse(dummyData['log4js,winston']),
      ),
      isMinimalMode: false,
      interval: 1,
    }),
  )
  .add('log4js, winston | monthly', () =>
    makeGraph({
      moduleNames: ['log4js', 'winston'],
      moduleData: processPackagesStats(
        standardizeNpmPackageResponse(dummyData['log4js,winston']),
      ),
      isMinimalMode: false,
      interval: 30,
    }),
  );
