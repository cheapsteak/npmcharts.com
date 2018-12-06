const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (baseConfig, env, config) => ({
  ...config,
  module: {
    ...config.module,
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
      ...config.module.rules,
    ],
  },
  plugins: [
    ...config.plugins,
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
  ],
  resolve: {
    ...config.resolve,
    alias: {
      ...config.alias,
      vue$: 'vue/dist/vue.esm.js',
    },
  },
});