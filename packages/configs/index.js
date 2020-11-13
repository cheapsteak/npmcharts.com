module.exports = {
  presetComparisons: [
    // build tools
    ['webpack', 'rollup', 'parcel-bundler', 'vite', 'snowpack'],
    // state managament
    ['mobx', 'redux', 'immer', 'immutable', 'recoil'],
    // styling
    ['styled-components', '@emotion/core', 'jss', 'emotion', 'tailwindcss'],
    // indicators?
    ['lodash', 'debug', 'typescript'],
    // frontend frameworks
    ['react', 'vue', '@angular/core', 'ember-cli', 'svelte', 'angular'],
    // .. SSR frameworks?
    ['gatsby', 'next'],
    // logging
    ['log4js', 'winston', 'bunyan', 'morgan', 'pino'],
    // database
    ['knex', 'sequelize', 'pg', 'typeorm', '@prisma/client', 'slonik'],
    // toolchain
    ['@babel/core', 'eslint', 'rome', 'jest'],
    // component libraries
    [
      '@chakra-ui/core',
      '@material-ui/core',
      'semantic-ui-react',
      '@fluentui/react',
      '@blueprintjs/core',
      'antd',
      '@adobe/react-spectrum',
    ],
    // http frameworks
    ['express', 'koa', '@hapi/hapi', 'connect', '@nestjs/core', 'fastify'],
  ],
  palette: [
    '#2196F3',
    '#f44336',
    '#9C27B0',
    '#85b706',
    '#808080',
    '#FF9800',
    '#3F51B5',
    '#795548',
    '#FFEB3B',
    '#c0392b',
    '#22aa99',
    '#109618',
    '#651067',
    '#dd4477',
    '#5574a6',
  ],
};
