const getPrefetchUrls = require('./prefetchUrls');

beforeEach(() => {
  jest.useFakeTimers('modern').setSystemTime(new Date('2020-10-13').getTime());
});

describe('getPrefetchUrls', () => {
  const start = 5;
  const end = 0;
  function getUrl(packageNames) {
    return `https://api.npmjs.org/downloads/range/2020-10-08:2020-10-13/${packageNames.join(
      ',',
    )}`;
  }
  test('all unscoped packages can be grouped into one request', () => {
    const packageNames = ['package-a', 'package-b', 'package-c'];

    expect(getPrefetchUrls(packageNames, start, end)).toEqual([
      getUrl(packageNames),
    ]);
  });
  test('all scoped packages need to be separated into one each', () => {
    const packageNames = [
      '@group/package-a',
      '@group/package-b',
      '@group/package-c',
    ];

    expect(getPrefetchUrls(packageNames, start, end)).toEqual([
      getUrl(['@group/package-a']),
      getUrl(['@group/package-b']),
      getUrl(['@group/package-c']),
    ]);
  });
  test('mix of unscoped and scoped packages: scoped need to be independent, unscoped can be grouped', () => {
    const packageNames = [
      'unscoped-package-a',
      'unscoped-package-b',
      'unscoped-package-c',
      '@group/package-a',
      '@group/package-b',
      '@group/package-c',
    ];

    expect(getPrefetchUrls(packageNames, start, end)).toEqual([
      getUrl(['@group/package-a']),
      getUrl(['@group/package-b']),
      getUrl(['@group/package-c']),
      getUrl([
        'unscoped-package-a',
        'unscoped-package-b',
        'unscoped-package-c',
      ]),
    ]);
  });
});
