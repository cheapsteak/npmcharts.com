// eslint-disable-next-line import/no-webpack-loader-syntax
const html = require('raw-loader!frontend/public/index.html');

exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: html + 'testtesttest',
  };
};
