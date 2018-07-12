const url = require('url');

const route = require('path-match')({
  // path-to-regexp options
  sensitive: false,
  strict: false,
  end: false,
});

const match = route('/compare/:packages([^/]+[/]*[^/]+)');

module.exports = urlString => {
  const parsedUrl = url.parse(urlString);
  const routeParams = match(parsedUrl.pathname);
  return routeParams.packages ? routeParams.packages.split(',') : [];
};
