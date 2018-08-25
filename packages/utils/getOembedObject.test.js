const getOembedObject = require('./getOembedObject');

test('getOembedObject output matches snapshot', () => {
  expect(
    getOembedObject({
      url: 'https://npmcharts.com',
      width: 700,
      height: 500,
    }),
  ).toMatchSnapshot();

  expect(
    getOembedObject({
      url:
        'https://npmcharts.com/compare/glamor,aphrodite,radium,glamorous,styled-components,jss,emotion',
      width: 700,
      height: 500,
    }),
  ).toMatchSnapshot();
});
