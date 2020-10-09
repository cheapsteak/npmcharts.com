const url = require('url');
const querystring = require('querystring');

module.exports = urlString => {
  const parsedUrl = url.parse(urlString);
  const queryParams = querystring.parse(parsedUrl.query);
  const outgoingQueryParams = querystring.stringify(
    Object.assign({}, queryParams, { minimal: true }),
  );
  const embedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}?${outgoingQueryParams}`;
  return embedUrl;
};
