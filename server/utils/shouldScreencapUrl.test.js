const shouldScreencapUrl = require('./shouldScreencapUrl');

test('only allow urls of packages to return true', () => {
  expect(shouldScreencapUrl('https://npmcharts.com/compare/glamor')).toBe(true);
  expect(shouldScreencapUrl('http://localhost/compare/glamor')).toBe(true);
  expect(
    shouldScreencapUrl('https://npmcharts.com/compare/glamor,emotion'),
  ).toBe(true);
  expect(shouldScreencapUrl('https://npmcharts.com/compare/')).toBe(false);
  expect(shouldScreencapUrl('https://npmcharts.com/')).toBe(false);
  expect(shouldScreencapUrl('https://google.com/')).toBe(false);
  expect(shouldScreencapUrl('https://google.com/compare/glamor')).toBe(false);
  expect(shouldScreencapUrl('google.com/compare/glamor')).toBe(false);
  expect(shouldScreencapUrl('googlecom/compare/glamor')).toBe(false);
});
