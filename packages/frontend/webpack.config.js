const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const glob = require('glob');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const { VueLoaderPlugin } = require('vue-loader')


const outDir = path.resolve(__dirname, 'public');

const babelConfig = require('../../babel.config.js');

module.exports = (env, opts) => {
  const options = opts || {};

  return {
    entry: {
      app: ['./src/index.js', ...glob.sync('./src/**/*.styl')],
    },
    output: {
      path: outDir,
      pathinfo: true,
      filename: 'static/[name].bundle.js',
      // if on netlify, use netlify's absolute url
      // https://docs.netlify.com/configure-builds/environment-variables/#deploy-urls-and-metadata
      publicPath: process.env.DEPLOY_URL ? `${process.env.DEPLOY_URL}/` : '/',
    },
    devServer: {
      historyApiFallback: true,
      static: [path.join(__dirname, 'src/assets')],
      compress: true,
      port: 9001,
      proxy: [
        {
          context: ['/api'],
          target: 'http://localhost:3896',
        }
      ]
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader'
        },
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
              exclude: [
                /\.html$/,
                /\.(js|jsx|mjs)$/,
                /\.(ts|tsx)$/,
                /\.(vue)$/,
                /\.(less)$/,
                /\.(re)$/,
                /\.(s?css|sass)$/,
                /\.json$/,
                /\.bmp$/,
                /\.gif$/,
                /\.jpe?g$/,
                /\.png$/
              ],
              use: (info) => {
                return info.compiler !== 'HtmlWebpackCompiler' ? [{
                  loader: require.resolve('file-loader')
                }]:[]},
            },
            
          ],
        },
      ],
    },

    optimization: {
      minimize: options.mode === 'production',
      minimizer: [
        new TerserPlugin({
          cache: false,
          terserOptions: {
            compress: false,
            mangle: true,
          },
          parallel: true,
          sourceMap: true,
          extractComments: true,
        }),
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

      new CopyWebpackPlugin({
        patterns: [
          {
            from: '**/*',
            to: outDir,
            context: './src/assets'
          },
        ]
      }),

      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-stats.html',
        openAnalyzer: false,
      }),
      new VueLoaderPlugin(),
    ],
    // resolve: {
    //   alias: {
    //     vue$: 'vue/dist/vue.esm.js',
    //   },
    // },
  };
};
