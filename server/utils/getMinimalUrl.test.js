const getMinimalUrl = require('./getMinimalUrl');

test('getMinimalUrl outputs correct minimal url', () => {
  expect(
    getMinimalUrl(
      'https://npmcharts.com/compare/glamor,aphrodite,radium,glamorous,styled-components,jss,emotion',
    ),
  ).toBe(
    'https://npmcharts.com/compare/glamor,aphrodite,radium,glamorous,styled-components,jss,emotion?minimal=true',
  );
});

test('getMinimalUrl merges existing query params to output url', () => {
  expect(getMinimalUrl('https://npmcharts.com/?test=234')).toBe(
    'https://npmcharts.com/?test=234&minimal=true',
  );
});
