import dummyData from 'utils/dummyData/log4js,winston.json';

import standardizeNpmPackageResponse from 'utils/stats/standardizeNpmPackageResponse';
import { processPackagesStats } from 'frontend/src/utils/processPackagesStats';

describe('processPackageStats', () => {
  it('converts packages to the right shape', () => {
    expect(
      processPackagesStats(standardizeNpmPackageResponse(dummyData)),
    ).toMatchSnapshot();
  });
});
