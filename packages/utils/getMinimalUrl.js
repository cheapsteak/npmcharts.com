import * as url from 'url';
import * as querystring from 'querystring';

export default urlString => {
  const parsedUrl = url.parse(urlString);
  const queryParams = querystring.parse(parsedUrl.query);
  const outgoingQueryParams = querystring.stringify(
    Object.assign({}, queryParams, { minimal: true }),
  );
  const embedUrl = `${parsedUrl.protocol}//${parsedUrl.host}${parsedUrl.pathname}?${outgoingQueryParams}`;
  return embedUrl;
};
