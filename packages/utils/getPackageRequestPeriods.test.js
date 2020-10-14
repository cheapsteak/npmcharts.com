const getPackageRequestPeriods = require('./getPackageRequestPeriods');

beforeEach(() => {
  jest.useFakeTimers('modern').setSystemTime(new Date('2020-10-13').getTime());
});

test('getPackageRequestPeriods for 1 day', () => {
  expect(getPackageRequestPeriods(1, 0)).toEqual([
    {
      startDate: '2020-10-12',
      endDate: '2020-10-13',
    },
  ]);
});

test('getPackageRequestPeriods for 100 day', () => {
  expect(getPackageRequestPeriods(100, 0)).toEqual([
    {
      startDate: '2020-07-05',
      endDate: '2020-10-13',
    },
  ]);
});
test('getPackageRequestPeriods for 1000 day', () => {
  expect(getPackageRequestPeriods(1000, 0)).toEqual([
    {
      startDate: '2018-01-17',
      endDate: '2019-01-17',
    },
    {
      startDate: '2019-01-18',
      endDate: '2020-01-18',
    },
    {
      startDate: '2020-01-19',
      endDate: '2020-10-13',
    },
  ]);
});
