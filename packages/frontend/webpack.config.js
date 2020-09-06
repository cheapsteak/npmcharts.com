const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const glob = require('glob');

const outDir = path.resolve(__dirname, 'public');

const babelConfig = require('../../babel.config.js');

module.exports = {
  entry: {
    app: ['./src/index.js', ...glob.sync('./src/**/*.styl')],
  },
  output: {
    path: outDir,
    pathinfo: true,
    filename: 'static/[name].bundle.js',
    publicPath: '/',
  },
  devServer: {
    historyApiFallback: true,
    contentBase: [path.join(__dirname, 'src/assets')],
    compress: true,
    port: 9001,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  module: {
    rules: [
      {
        oneOf: [
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
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: babelConfig,
            },
          },
          {
            test: /\.(styl|css)$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              'stylus-loader',
            ].filter(Boolean),
          },
          { test: /\.pug$/, loader: 'pug-loader' },
          {
            test: /\.svg$/,
            loader: 'svg-inline-loader',
          },
          {
            loader: require.resolve('file-loader'),
            exclude: [/\.js$/, /\.html$/, /\.json$/],
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.pug',
    }),

    new CopyWebpackPlugin(
      [
        {
          from: '**/*',
          to: outDir,
        },
      ],
      { context: './src/assets' },
    ),
  ],
  // resolve: {
  //   alias: {
  //     vue$: 'vue/dist/vue.esm.js',
  //   },
  // },
};
