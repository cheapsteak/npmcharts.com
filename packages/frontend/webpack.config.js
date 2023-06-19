const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const outDir = path.resolve(__dirname, 'public');

const babelConfig = require('../../babel.config.js');

module.exports = (env, opts) => {
  const options = opts || {};

  return {
    entry: {
      app: ['./src/index.tsx', './src/style.styl'],
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
      proxy: {
        '/api': 'http://localhost:3896',
      },
    },
    module: {
      rules: [
        {
          oneOf: [
            {
              test: /\.(js|ts|tsx)$/,
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
          ],
        },
      ],
    },

    optimization: {
      minimize: options.mode === 'production',
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: false,
            mangle: true,
          },
          parallel: true,
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

      new CopyWebpackPlugin(
        [
          {
            from: '**/*',
            to: outDir,
          },
        ],
        { context: './src/assets' },
      ),

      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-stats.html',
        openAnalyzer: false,
      }),
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.json'],
    },
  };
};
