import getPackageDownloads from './getPackagesDownloads';
import dummyData from '../dummyData';

jest.mock('./fetchPackagesStats');
const fetchPackagesStats = require('./fetchPackagesStats');

const packages = ['log4js', 'winston'];
const startDate = '2017-08-25';
const endDate = '2017-08-25';

describe('getPackageDownloads', () => {
  it('Calls fetchPackagesStats with the correct arguments', async done => {
    fetchPackagesStats.mockImplementationOnce(args => Promise.resolve({}));

    await getPackageDownloads(packages, { startDate, endDate });

    expect(fetchPackagesStats).toHaveBeenCalledWith(
      packages,
      startDate,
      endDate,
    );
    done();
  });

  it('Processes fetched data', async done => {
    fetchPackagesStats.mockImplementationOnce(modules =>
      Promise.resolve(dummyData[modules.join(',')]),
    );

    const results = await getPackageDownloads(packages, { startDate, endDate });

    expect(results[0]).toMatchSnapshot();
    done();
  });
});
