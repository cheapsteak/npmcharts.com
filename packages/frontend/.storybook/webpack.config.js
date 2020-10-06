const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const babelConfig = require('./.babelrc');

module.exports = (storybookBaseConfig, configType, defaultConfig) => {
  const mergedConfig = {
    ...defaultConfig,
    module: {
      ...defaultConfig.module,
      rules: [
        {
          test: /\.(styl|css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
            'stylus-loader',
          ].filter(Boolean),
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'babel-loader',
              options: babelConfig,
            },
            {
              loader: 'vue-template-loader',
              options: {
                transformAssetUrls: {
                  // The key should be an element name
                  // The value should be an attribute name or an array of attribute names
                  img: 'src',
                },
              },
            },
          ],
        },
        ...defaultConfig.module.rules.map((x) => {
          if (x.test.source === /\.(mjs|jsx?)$/.source) {
            x.use[0].options.plugins.push(
              '@babel/plugin-proposal-optional-chaining',
            );
            return x;
          }
          return x;
        }),
      ],
    },
    plugins: [
      ...defaultConfig.plugins,
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        filename: '[name].css',
        chunkFilename: '[id].css',
      }),
    ],
    resolve: {
      ...defaultConfig.resolve,
      alias: {
        ...defaultConfig.alias,
        vue$: 'vue/dist/vue.esm.js',
      },
    },
  };

  // uncommenting this will cause the log graph to bork (points that should be at 0 go to max(y))
  // mergedConfig.optimization.minimizer[0].options.terserOptions.mangle = true;

  return mergedConfig;
};
