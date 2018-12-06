const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (storybookBaseConfig, configType, defaultConfig) => ({
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
      ...defaultConfig.module.rules,
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
});