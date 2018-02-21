const getPackagesFromUrl = require('./getPackagesFromUrl');

test('getPackagesFromUrl correctly parses packages from url', () => {
  expect(
    getPackagesFromUrl(
      '/compare/glamor,aphrodite,radium,glamorous,styled-components,jss,emotion,@angular/core',
    ),
  ).toEqual([
    'glamor',
    'aphrodite',
    'radium',
    'glamorous',
    'styled-components',
    'jss',
    'emotion',
    '@angular/core',
  ]);
});
