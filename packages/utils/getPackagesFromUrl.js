const url = require('url');

module.exports = urlString => {
  // pathName does not include query params
  const pathname = url.parse(urlString).pathname;
  if (pathname === '/') {
    return [];
  }
  return pathname.replace(/^\/compare\//, '').split(',') || [];
};
