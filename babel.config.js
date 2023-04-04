module.exports = {
  sourceType: 'unambiguous',
  presets: [
    ['@babel/preset-react', { runtime: 'automatic' }],
    '@babel/preset-typescript',
    [
      '@babel/preset-env',
      {
        corejs: 3,
        modules: 'auto',
        useBuiltIns: 'usage',
        targets: ['>1%', 'not ie 11', 'not op_mini all'],
      },
    ],
  ],
  plugins: [
    'lodash',
    'date-fns',
    'vuera/babel',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            corejs: 3,
            useBuiltIns: 'usage',
            targets: {
              node: 'current',
            },
          },
        ],
      ],
    },
  },
};
