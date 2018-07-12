const getOembedObject = require('./getOembedObject');

test('getOembedObject output matches snapshot', () => {
  expect(
    getOembedObject({
      url: '/',
      width: 700,
      height: 500,
    }),
  ).toMatchSnapshot();

  expect(
    getOembedObject({
      url:
        '/compare/glamor,aphrodite,radium,glamorous,styled-components,jss,emotion',
      width: 700,
      height: 500,
    }),
  ).toMatchSnapshot();
});
