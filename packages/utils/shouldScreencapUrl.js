const url = require('url');
const getPackagesFromUrl = require('./getPackagesFromUrl');

module.exports = urlString => {
  const parsedUrl = url.parse(urlString);

  if (!['npmcharts.com', 'localhost'].includes(parsedUrl.hostname)) {
    return false;
  }

  const packages = getPackagesFromUrl(urlString);
  if (!packages.length) {
    return false;
  }

  return true;
};
