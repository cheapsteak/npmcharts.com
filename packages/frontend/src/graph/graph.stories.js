import { storiesOf } from '@storybook/vue';

import { processPackagesStats } from 'frontend/src/utils/processPackagesStats';
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
          :module-names="packageNames"
          :package-download-stats="packageDownloadStats"
          :interval="interval"
          :is-minimal-mode="isMinimalMode === 'true'"
          :useLogScale="false"
        >
        </graph>
      </div>
    </main>
  `,
});

storiesOf('graph', module)
  .add('log4js, winston | weekly', () =>
    makeGraph({
      packageNames: ['log4js', 'winston'],
      packageDownloadStats: processPackagesStats(
        standardizeNpmPackageResponse(dummyData['log4js,winston']),
      ),
      isMinimalMode: false,
      interval: 7,
    }),
  )
  .add('log4js, winston | daily', () =>
    makeGraph({
      packageNames: ['log4js', 'winston'],
      packageDownloadStats: processPackagesStats(
        standardizeNpmPackageResponse(dummyData['log4js,winston']),
      ),
      isMinimalMode: false,
      interval: 1,
    }),
  )
  .add('log4js, winston | monthly', () =>
    makeGraph({
      packageNames: ['log4js', 'winston'],
      packageDownloadStats: processPackagesStats(
        standardizeNpmPackageResponse(dummyData['log4js,winston']),
      ),
      isMinimalMode: false,
      interval: 30,
    }),
  );
